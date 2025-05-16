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

exports.getEventImpactAnalytics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin required.' });
    }

    const cacheKey = 'eventImpactAnalytics';
    let cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        ...cachedData,
        fromCache: true,
        cachedAt: cachedData.generatedAt
      });
    }

    const startTime = Date.now();

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
            eventId: '$event',
            qrType: '$qrCodeData.type'
          },
          eventTitle: { $first: '$eventData.title' },
          eventDate: { $first: '$eventData.date' },
          eventLocation: { $first: '$eventData.location' },
          activityType: { $first: '$eventData.activityType' },
          activities: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' },
          totalFoodProcessed: { $sum: '$quantity' },
          activitiesWithNFT: { 
            $sum: { $cond: [{ $ne: ['$nftId', null] }, 1, 0] } 
          }
        }
      },
      {
        $group: {
          _id: '$_id.eventId',
          eventTitle: { $first: '$eventTitle' },
          eventDate: { $first: '$eventDate' },
          eventLocation: { $first: '$eventLocation' },
          activityType: { $first: '$activityType' },
          breakdown: {
            $push: {
              type: '$_id.qrType',
              activities: '$activities',
              uniqueUsers: '$uniqueUsers',
              uniqueUserCount: { $size: '$uniqueUsers' },
              totalFood: '$totalFoodProcessed',
              nftsMinted: '$activitiesWithNFT'
            }
          }
        }
      },
      {
        $addFields: {
          volunteers: {
            $arrayElemAt: [
              { $filter: { input: '$breakdown', as: 'item', cond: { $eq: ['$$item.type', 'volunteer'] } } },
              0
            ]
          },
          recipients: {
            $arrayElemAt: [
              { $filter: { input: '$breakdown', as: 'item', cond: { $eq: ['$$item.type', 'recipient'] } } },
              0
            ]
          }
        }
      },
      {
        $addFields: {
          totalVolunteers: { $ifNull: ['$volunteers.uniqueUserCount', 0] },
          totalRecipients: { $ifNull: ['$recipients.uniqueUserCount', 0] },
          totalFoodRescued: { 
            $add: [
              { $ifNull: ['$volunteers.totalFood', 0] },
              { $ifNull: ['$recipients.totalFood', 0] }
            ]
          },
          totalActivities: { 
            $add: [
              { $ifNull: ['$volunteers.activities', 0] },
              { $ifNull: ['$recipients.activities', 0] }
            ]
          },
          totalNFTsMinted: { $ifNull: ['$volunteers.nftsMinted', 0] },
          totalRewards: {
            $multiply: [
              { $ifNull: ['$volunteers.nftsMinted', 0] },
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
          }
        }
      },
      {
        $addFields: {
          totalUniqueParticipants: {
            $size: {
              $reduce: {
                input: '$breakdown',
                initialValue: [],
                in: { $setUnion: ['$$value', '$$this.uniqueUsers'] }
              }
            }
          },
          participationRate: {
            $cond: [
              { $gt: ['$totalActivities', 0] },
              { 
                $round: [
                  { 
                    $multiply: [
                      { $divide: ['$totalNFTsMinted', '$totalActivities'] },
                      100
                    ]
                  },
                  1
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { eventDate: -1 } }
    ]);

    const totals = eventImpacts.reduce((acc, event) => {
      acc.totalEvents++;
      acc.totalVolunteers += event.totalVolunteers;
      acc.totalRecipients += event.totalRecipients;
      acc.totalActivities += event.totalActivities;
      acc.totalRewards += event.totalRewards;
      acc.totalFoodRescued += event.totalFoodRescued;
      acc.totalNFTs += event.totalNFTsMinted;
      
      acc.allParticipants = acc.allParticipants || new Set();
      event.breakdown?.forEach(b => {
        b.uniqueUsers?.forEach(user => acc.allParticipants.add(user.toString()));
      });
      
      return acc;
    }, {
      totalEvents: 0,
      totalVolunteers: 0,
      totalRecipients: 0,
      totalActivities: 0,
      totalRewards: 0,
      totalFoodRescued: 0,
      totalNFTs: 0
    });

    totals.totalUniqueParticipants = totals.allParticipants?.size || 0;
    delete totals.allParticipants; 

    const calculationTime = Date.now() - startTime;

    const responseData = {
      summary: totals,
      eventImpacts: eventImpacts.map(event => ({
        _id: event._id,
        eventTitle: event.eventTitle,
        eventDate: event.eventDate,
        eventLocation: event.eventLocation,
        activityType: event.activityType,
        totalVolunteers: event.totalVolunteers,
        totalRecipients: event.totalRecipients,
        totalUniqueParticipants: event.totalUniqueParticipants,
        totalActivities: event.totalActivities,
        totalFoodRescued: event.totalFoodRescued,
        totalNFTsMinted: event.totalNFTsMinted,
        totalRewards: event.totalRewards,
        participationRate: event.participationRate,
        volunteerDetails: event.volunteers || { uniqueUserCount: 0, activities: 0, totalFood: 0, nftsMinted: 0 },
        recipientDetails: event.recipients || { uniqueUserCount: 0, activities: 0, totalFood: 0, nftsMinted: 0 }
      })),
      generatedAt: new Date(),
      fromCache: false,
      calculationTime: `${calculationTime}ms`
    };

    cache.set(cacheKey, responseData, 300);

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error getting event impact analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};