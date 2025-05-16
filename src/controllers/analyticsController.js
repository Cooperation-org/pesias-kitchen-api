const Activity = require('../models/Activity');
const Event = require('../models/Event');
const User = require('../models/User');
const QRCode = require('../models/QRCode');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 300 });

exports.getFoodHeroesImpact = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin required.' });
    }

    const cacheKey = 'foodHeroesImpact';
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        ...cachedData,
        fromCache: true,
        cachedAt: cachedData.generatedAt
      });
    }

    const startTime = Date.now();

    const totalRewardsData = await Activity.aggregate([
      { $match: { nftId: { $ne: null } } },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventData'
        }
      },
      { $unwind: '$eventData' },
      {
        $group: {
          _id: '$eventData.activityType',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    let totalGDollarsDistributed = 0;
    const rewardBreakdown = {};
    
    totalRewardsData.forEach(item => {
      let rewardPerActivity;
      switch (item._id) {
        case 'food_sorting': rewardPerActivity = 1; break;
        case 'food_distribution': rewardPerActivity = 2; break;
        case 'food_pickup': rewardPerActivity = 1.5; break;
        default: rewardPerActivity = 1;
      }
      
      const typeTotal = item.count * rewardPerActivity;
      totalGDollarsDistributed += typeTotal;
      
      rewardBreakdown[item._id] = {
        activities: item.count,
        totalFood: item.totalQuantity,
        totalRewards: typeTotal,
        rewardPerActivity
      };
    });

    const totalNFTsMinted = await Activity.countDocuments({ nftId: { $ne: null } });

    const foodRescueData = await Activity.aggregate([
      {
        $group: {
          _id: null,
          totalFoodRescued: { $sum: '$quantity' },
          totalActivities: { $sum: 1 }
        }
      }
    ]);
    const totalFoodRescued = foodRescueData[0]?.totalFoodRescued || 0;
    const totalActivities = foodRescueData[0]?.totalActivities || 0;

    const foodByType = await Activity.aggregate([
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventData'
        }
      },
      { $unwind: '$eventData' },
      {
        $group: {
          _id: '$eventData.activityType',
          totalFood: { $sum: '$quantity' },
          activities: { $sum: 1 }
        }
      }
    ]);

    const totalFoodHeroes = await User.countDocuments();
    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });
    const totalRecipients = await User.countDocuments({ role: 'recipient' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    const activeFoodHeroes = await Activity.distinct('user');
    const totalActiveFoodHeroes = activeFoodHeroes.length;

    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ date: { $gte: new Date() } });
    const pastEvents = await Event.countDocuments({ date: { $lt: new Date() } });

    const eventsByType = await Event.aggregate([
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalQRCodes = await QRCode.countDocuments();
    const totalQRUsage = await QRCode.aggregate([
      {
        $group: {
          _id: null,
          totalScans: { $sum: '$usedCount' }
        }
      }
    ]);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentImpact = await Activity.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }
          },
          activities: { $sum: 1 },
          nfts: { $sum: { $cond: [{ $ne: ['$nftId', null] }, 1, 0] } },
          foodRescued: { $sum: '$quantity' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    const avgFoodPerEvent = totalEvents > 0 ? totalFoodRescued / totalEvents : 0;
    const avgRewardsPerEvent = totalEvents > 0 ? totalGDollarsDistributed / totalEvents : 0;

    const responseData = {
      foodHeroesImpact: {
        totalGDollarsDistributed,
        totalNFTsMinted,
        totalFoodRescued,
        totalActivities,
        totalActiveFoodHeroes,
        totalEvents,
        avgFoodPerEvent: Math.round(avgFoodPerEvent * 100) / 100,
        avgRewardsPerEvent: Math.round(avgRewardsPerEvent * 100) / 100
      },
      rewardBreakdown,
      foodByType,
      foodHeroesStats: {
        total: totalFoodHeroes,
        volunteers: totalVolunteers,
        recipients: totalRecipients,
        admins: totalAdmins,
        active: totalActiveFoodHeroes,
        participationRate: totalFoodHeroes > 0 ? Math.round((totalActiveFoodHeroes / totalFoodHeroes) * 100) : 0
      },
      eventStats: {
        total: totalEvents,
        active: activeEvents,
        completed: pastEvents,
        byType: eventsByType
      },
      qrStats: {
        totalCodes: totalQRCodes,
        totalScans: totalQRUsage[0]?.totalScans || 0,
        avgScansPerCode: totalQRCodes > 0 ? Math.round((totalQRUsage[0]?.totalScans || 0) / totalQRCodes * 100) / 100 : 0
      },
      recentActivity: recentImpact,
      generatedAt: new Date(),
      fromCache: false,
      calculationTime: Date.now() - startTime + 'ms'
    };

    cache.set(cacheKey, responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error getting Food Heroes impact:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEventImpactAnalytics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin required.' });
    }

    const cacheKey = 'eventImpactAnalytics';
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const eventImpacts = await Activity.aggregate([
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventData'
        }
      },
      { $unwind: '$eventData' },
      {
        $group: {
          _id: '$event',
          eventTitle: { $first: '$eventData.title' },
          eventDate: { $first: '$eventData.date' },
          eventLocation: { $first: '$eventData.location' },
          activityType: { $first: '$eventData.activityType' },
          totalActivities: { $sum: 1 },
          activitiesWithNFT: { 
            $sum: { $cond: [{ $ne: ['$nftId', null] }, 1, 0] } 
          },
          totalFoodRescued: { $sum: '$quantity' },
          uniqueFoodHeroes: { $addToSet: '$user' }
        }
      },
      {
        $addFields: {
          uniqueFoodHeroesCount: { $size: '$uniqueFoodHeroes' },
          totalRewards: {
            $multiply: [
              '$activitiesWithNFT',
              {
                $switch: {
                  branches: [
                    { case: { $eq: ['$activityType', 'food_sorting'] }, then: 1 },
                    { case: { $eq: ['$activityType', 'food_distribution'] }, then: 2 },
                    { case: { $eq: ['$activityType', 'food_pickup'] }, then: 1.5 }
                  ],
                  default: 1
                }
              }
            ]
          },
          participationRate: {
            $multiply: [
              { $divide: ['$activitiesWithNFT', '$totalActivities'] },
              100
            ]
          }
        }
      },
      {
        $project: {
          uniqueFoodHeroes: 0 
        }
      },
      { $sort: { eventDate: -1 } }
    ]);

    const totals = eventImpacts.reduce((acc, event) => {
      acc.totalEvents++;
      acc.totalActivities += event.totalActivities;
      acc.totalRewards += event.totalRewards;
      acc.totalFoodRescued += event.totalFoodRescued;
      acc.totalNFTs += event.activitiesWithNFT;
      acc.totalFoodHeroes += event.uniqueFoodHeroesCount;
      return acc;
    }, {
      totalEvents: 0,
      totalActivities: 0,
      totalRewards: 0,
      totalFoodRescued: 0,
      totalNFTs: 0,
      totalFoodHeroes: 0
    });

    const responseData = {
      summary: totals,
      eventImpacts,
      generatedAt: new Date()
    };

    cache.set(cacheKey, responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error getting event impact analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};