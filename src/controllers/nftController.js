
const Activity = require('../models/Activity');

exports.getNFTDetails = async (req, res) => {
  try {
    const { nftId } = req.params;
    
    const activity = await Activity.findOne({ nftId })
      .populate('event')
      .populate('user', 'name walletAddress');
    
    if (!activity) {
      return res.status(404).json({ message: 'NFT not found' });
    }
    
    let rewardAmount;
    switch (activity.event.activityType) {
      case 'food_sorting': rewardAmount = 1; break;
      case 'food_distribution': rewardAmount = 2; break;
      case 'food_pickup': rewardAmount = 1.5; break;
      default: rewardAmount = 1;
    }
    
    const nftMetadata = {
      id: activity.nftId,
      name: `Pesia's Kitchen - ${activity.event.activityType.replace('_', ' ')}`,
      description: `Food rescue activity at ${activity.event.location} with quantity ${activity.quantity}kg`,
      image: `${req.protocol}://${req.get('host')}/api/nft/${activity.nftId}/image`,
      attributes: [
        { trait_type: 'Activity Type', value: activity.event.activityType.replace('_', ' ') },
        { trait_type: 'Location', value: activity.event.location },
        { trait_type: 'Quantity', value: `${activity.quantity} kg` },
        { trait_type: 'Date', value: new Date(activity.timestamp).toISOString().split('T')[0] },
        { trait_type: 'Reward', value: `${rewardAmount} G$` }
      ],
      txHash: activity.txHash || 'mock-transaction',
      owner: activity.user.walletAddress
    };
    
    res.status(200).json(nftMetadata);
  } catch (error) {
    console.error('Error fetching NFT details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getNFTImage = async (req, res) => {
  try {
    const { nftId } = req.params;
    
    const activity = await Activity.findOne({ nftId })
      .populate('event');
    
    if (!activity) {
      return res.status(404).json({ message: 'NFT not found' });
    }
    
    let color;
    switch (activity.event.activityType) {
      case 'food_sorting': color = '#4CAF50'; break; 
      case 'food_distribution': color = '#2196F3'; break; 
      case 'food_pickup': color = '#FF9800'; break; 
      default: color = '#9C27B0'; e
    }
    
    const svgImage = `
      <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
        <!-- Background -->
        <rect width="500" height="500" fill="#f8f9fa"/>
        <rect x="20" y="20" width="460" height="460" rx="15" ry="15" fill="white" stroke="${color}" stroke-width="3"/>
        
        <!-- Header -->
        <rect x="20" y="20" width="460" height="80" rx="15" ry="15" fill="${color}"/>
        <text x="250" y="70" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle" fill="white">Pesia's Kitchen NFT</text>
        
        <!-- Activity Type -->
        <text x="250" y="140" font-family="Arial" font-size="22" font-weight="bold" text-anchor="middle" fill="#333">${activity.event.activityType.replace('_', ' ').toUpperCase()}</text>
        
        <!-- Icon (simplified) -->
        <circle cx="250" cy="200" r="50" fill="${color}" opacity="0.2"/>
        <text x="250" y="215" font-family="Arial" font-size="32" text-anchor="middle" fill="${color}">🥫</text>
        
        <!-- Details -->
        <text x="100" y="290" font-family="Arial" font-size="16" fill="#333">Location:</text>
        <text x="400" y="290" font-family="Arial" font-size="16" text-anchor="end" fill="#555">${activity.event.location}</text>
        
        <text x="100" y="320" font-family="Arial" font-size="16" fill="#333">Quantity:</text>
        <text x="400" y="320" font-family="Arial" font-size="16" text-anchor="end" fill="#555">${activity.quantity}kg</text>
        
        <text x="100" y="350" font-family="Arial" font-size="16" fill="#333">Date:</text>
        <text x="400" y="350" font-family="Arial" font-size="16" text-anchor="end" fill="#555">${new Date(activity.timestamp).toLocaleDateString()}</text>
        
        <text x="100" y="380" font-family="Arial" font-size="16" fill="#333">Reward:</text>
        <text x="400" y="380" font-family="Arial" font-size="16" text-anchor="end" fill="#555">${activity.event.activityType === 'food_sorting' ? '1' : 
                 activity.event.activityType === 'food_distribution' ? '2' : '1.5'} G$</text>
        
        <!-- Footer -->
        <text x="250" y="440" font-family="Arial" font-size="12" text-anchor="middle" fill="#888">NFT ID: ${activity.nftId}</text>
        <text x="250" y="460" font-family="Arial" font-size="12" text-anchor="middle" fill="#888">Created by Pesia's Kitchen EAT Initiative</text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svgImage);
  } catch (error) {
    console.error('Error generating NFT image:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserNFTs = async (req, res) => {
  try {
    const activities = await Activity.find({
      user: req.user.userId,
      nftId: { $ne: null }
    }).populate('event');
    
    if (!activities || activities.length === 0) {
      return res.status(200).json({ message: 'No NFTs found', nfts: [] });
    }
    
    const nfts = activities.map(activity => {
      return {
        id: activity.nftId,
        name: `Pesia's Kitchen - ${activity.event.activityType.replace('_', ' ')}`,
        imageUrl: `${req.protocol}://${req.get('host')}/api/nft/${activity.nftId}/image`,
        activityType: activity.event.activityType,
        location: activity.event.location,
        quantity: activity.quantity,
        date: activity.timestamp,
        txHash: activity.txHash || 'mock-transaction'
      };
    });
    
    res.status(200).json({ nfts });
  } catch (error) {
    console.error('Error fetching user NFTs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};