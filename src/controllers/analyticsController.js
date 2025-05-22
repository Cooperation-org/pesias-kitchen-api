const Activity = require('../models/Activity');
const Event = require('../models/Event');
const User = require('../models/User');
const QRCode = require('../models/QRCode');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 300 });

exports.getFoodHeroesImpact = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Admin required.' });
    }

    const cacheKey = 'foodHeroesImpact';
    let cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        ...cachedData,
        fromCache: true,
        cachedAt: cachedData.generatedAt
      });
    }

    const startTime = Date.now();

    const participantBreakdown = await Activity.aggregate([
      {
        $lookup: {
          from: 'qrcodes',
          localField: 'qrCode',
          foreignField: '_id',
          as: 'qrCodeData'
        }
      },
      { $unwind: '$qrCodeData' },
      {
        $group: {
          _id: '$qrCodeData.type',
          uniqueUsers: { $addToSet: '$user' },
          totalActivities: { $sum: 1 },
          totalFood: { $sum: '$quantity' },
          activitiesWithNFT: { 
            $sum: { $cond: [{ $ne: ['$nftId', null] }, 1, 0] } 
          }
        }
      },
      {
        $addFields: {
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      }
    ]);

    let volunteersCount = 0;
    let recipientsCount = 0;
    let totalGDollarsDistributed = 0;
    let totalActivitiesWithNFT = 0;

    const rewardsByActivityType = await Activity.aggregate([
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
          count: { $sum: 1 }
        }
      }
    ]);

    const rewardBreakdown = {};
    rewardsByActivityType.forEach(item => {
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
        totalRewards: typeTotal,
        rewardPerActivity
      };
    });

    participantBreakdown.forEach(item => {
      if (item._id === 'volunteer') {
        volunteersCount = item.uniqueUserCount;
        totalActivitiesWithNFT += item.activitiesWithNFT;
      } else if (item._id === 'recipient') {
        recipientsCount = item.uniqueUserCount;
      }
    });

    const totalUniqueParticipants = await Activity.aggregate([
      {
        $group: {
          _id: null,
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $addFields: {
          totalUnique: { $size: '$uniqueUsers' }
        }
      }
    ]);

    const overallStats = await Activity.aggregate([
      {
        $group: {
          _id: null,
          totalActivities: { $sum: 1 },
          totalFoodRescued: { $sum: '$quantity' },
          totalNFTsMinted: { 
            $sum: { $cond: [{ $ne: ['$nftId', null] }, 1, 0] } 
          }
        }
      }
    ]);

    const stats = overallStats[0] || {};
    const uniqueCount = totalUniqueParticipants[0]?.totalUnique || 0;

    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ date: { $gte: new Date() } });
    const completedEvents = await Event.countDocuments({ date: { $lt: new Date() } });

    const eventsByType = await Event.aggregate([
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 }
        }
      }
    ]);

    const foodByActivityType = await Activity.aggregate([
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
          activities: { $sum: 1 },
          activitiesWithNFT: { 
            $sum: { $cond: [{ $ne: ['$nftId', null] }, 1, 0] } 
          }
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
    const recentParticipants = await Activity.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      {
        $lookup: {
          from: 'qrcodes',
          localField: 'qrCode',
          foreignField: '_id',
          as: 'qrCodeData'
        }
      },
      { $unwind: '$qrCodeData' },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            type: '$qrCodeData.type'
          },
          activities: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' },
          foodRescued: { $sum: '$quantity' },
          nfts: { $sum: { $cond: [{ $ne: ['$nftId', null] }, 1, 0] } }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          volunteers: {
            $sum: { 
              $cond: [
                { $eq: ['$_id.type', 'volunteer'] }, 
                { $size: '$uniqueUsers' }, 
                0
              ] 
            }
          },
          recipients: {
            $sum: { 
              $cond: [
                { $eq: ['$_id.type', 'recipient'] }, 
                { $size: '$uniqueUsers' }, 
                0
              ] 
            }
          },
          totalActivities: { $sum: '$activities' },
          totalFood: { $sum: '$foodRescued' },
          totalNFTs: { $sum: '$nfts' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const calculationTime = Date.now() - startTime;

    const responseData = {
      foodHeroesImpact: {
        totalVolunteers: volunteersCount,
        totalRecipients: recipientsCount,
        totalUniqueParticipants: uniqueCount,
        totalGDollarsDistributed,
        totalNFTsMinted: stats.totalNFTsMinted || 0,
        totalFoodRescued: stats.totalFoodRescued || 0,
        totalActivities: stats.totalActivities || 0,
        totalEvents,
        avgFoodPerEvent: totalEvents > 0 ? Math.round((stats.totalFoodRescued || 0) / totalEvents * 100) / 100 : 0,
        avgRewardsPerEvent: totalEvents > 0 ? Math.round(totalGDollarsDistributed / totalEvents * 100) / 100 : 0
      },
      participantBreakdown: {
        volunteers: {
          count: volunteersCount,
          activities: participantBreakdown.find(p => p._id === 'volunteer')?.totalActivities || 0,
          foodProcessed: participantBreakdown.find(p => p._id === 'volunteer')?.totalFood || 0,
          nftsMinted: participantBreakdown.find(p => p._id === 'volunteer')?.activitiesWithNFT || 0
        },
        recipients: {
          count: recipientsCount,
          activities: participantBreakdown.find(p => p._id === 'recipient')?.totalActivities || 0,
          foodReceived: participantBreakdown.find(p => p._id === 'recipient')?.totalFood || 0,
          nftsMinted: 0 
        }
      },
      rewardBreakdown,
      foodByActivityType,
      eventStats: {
        total: totalEvents,
        active: activeEvents,
        completed: completedEvents,
        byType: eventsByType
      },
      qrStats: {
        totalCodes: totalQRCodes,
        totalScans: totalQRUsage[0]?.totalScans || 0,
        avgScansPerCode: totalQRCodes > 0 ? Math.round((totalQRUsage[0]?.totalScans || 0) / totalQRCodes * 100) / 100 : 0
      },
      recentActivity: recentParticipants,
      generatedAt: new Date(),
      fromCache: false,
      calculationTime: `${calculationTime}ms`
    };

    cache.set(cacheKey, responseData, 300);

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error getting Food Heroes impact:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSingleEventImpact = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Admin required.' });
    }

    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    const eventExists = await Event.findById(eventId);
    if (!eventExists) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const cacheKey = `event_stats_${eventId}`;
    let cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        ...cachedData,
        fromCache: true,
        cachedAt: cachedData.generatedAt
      });
    }

    const startTime = Date.now();

    const activities = await Activity.find({ event: eventId })
      .populate('user', 'name walletAddress')
      .populate('qrCode')
      .lean();

    if (!activities.length) {
      return res.status(200).json({ 
        eventId,
        eventTitle: eventExists.title,
        message: 'No activity data found for this event',
        stats: {
          totalVolunteers: 0,
          totalRecipients: 0,
          totalActivities: 0,
          totalFoodProcessed: 0,
          totalNFTs: 0,
          totalRewards: 0
        }
      });
    }

    const volunteerActivities = activities.filter(a => a.qrCode?.type === 'volunteer');
    const recipientActivities = activities.filter(a => a.qrCode?.type === 'recipient');

    const uniqueVolunteers = new Set(volunteerActivities.map(a => a.user?._id.toString()));
    const uniqueRecipients = new Set(recipientActivities.map(a => a.user?._id.toString()));
    
    const totalVolunteers = uniqueVolunteers.size;
    const totalRecipients = uniqueRecipients.size;
    const totalActivities = activities.length;
    
    const totalFoodProcessed = activities.reduce((sum, activity) => 
      sum + (activity.quantity || 0), 0);
    
    const activitiesWithNFT = activities.filter(a => a.nftId).length;
    
    let totalRewards = 0;
    volunteerActivities.forEach(activity => {
      if (activity.nftId) {
        let rewardAmount = 1; 
        switch (eventExists.activityType) {
          case 'food_sorting': rewardAmount = 1; break;
          case 'food_distribution': rewardAmount = 2; break;
          case 'food_pickup': rewardAmount = 1.5; break;
        }
        totalRewards += rewardAmount;
      }
    });

    const volunteerStats = {
      uniqueCount: totalVolunteers,
      activities: volunteerActivities.length,
      foodProcessed: volunteerActivities.reduce((sum, a) => sum + (a.quantity || 0), 0),
      nftsMinted: volunteerActivities.filter(a => a.nftId).length
    };
    
    const recipientStats = {
      uniqueCount: totalRecipients,
      activities: recipientActivities.length,
      foodReceived: recipientActivities.reduce((sum, a) => sum + (a.quantity || 0), 0)
    };

    const responseData = {
      eventId,
      eventTitle: eventExists.title,
      eventDate: eventExists.date,
      eventLocation: eventExists.location,
      activityType: eventExists.activityType,
      stats: {
        totalVolunteers,
        totalRecipients,
        totalUniqueParticipants: uniqueVolunteers.size + uniqueRecipients.size,
        totalActivities,
        totalFoodProcessed,
        totalNFTs: activitiesWithNFT,
        totalRewards,
        participationRate: totalActivities > 0 
          ? Math.round((activitiesWithNFT / totalActivities) * 100) 
          : 0
      },
      breakdown: {
        volunteers: volunteerStats,
        recipients: recipientStats
      },
      generatedAt: new Date(),
      calculationTime: `${Date.now() - startTime}ms`
    };

    cache.set(cacheKey, responseData, 300);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error getting event statistics:', error);
    res.status(500).json({ 
      message: 'Failed to get event statistics', 
      error: error.message 
    });
  }
};