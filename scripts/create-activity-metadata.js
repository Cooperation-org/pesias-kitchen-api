const axios = require('axios');
require('dotenv').config();

async function uploadMetadataToIPFS(metadata, filename) {
  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          'pinata_api_key': process.env.PINATA_API_KEY,
          'pinata_secret_api_key': process.env.PINATA_API_SECRET,
        },
      }
    );
    
    if (response.status === 200) {
      console.log(`✅ ${filename} uploaded to IPFS: ${response.data.IpfsHash}`);
      return response.data.IpfsHash;
    } else {
      throw new Error(`Pinata responded with status ${response.status}`);
    }
  } catch (error) {
    console.error(`❌ Error uploading ${filename}:`, error.message);
    throw error;
  }
}

async function createActivityMetadata() {
  // Base image URL (same Food Rescue Hero image for all)
  const imageUrl = "https://gateway.pinata.cloud/ipfs/Qmef6Me5HzCzsrqrQyFeHQJuGSe6Hqu2NDGF5uBTtjnJig";
  
  // Food Sorting Hero metadata
  const sortingMetadata = {
    "name": "Pesia's Kitchen - Food Sorting Hero",
    "description": "A badge of honor for those who transform chaos into hope - organizing rescued food so families can be fed instead of landfills filled. No one should go hungry.",
    "image": imageUrl,
    "attributes": [
      {
        "trait_type": "Activity Type",
        "value": "Food Sorting"
      },
      {
        "trait_type": "Organization", 
        "value": "Pesia's Kitchen"
      },
      {
        "trait_type": "Hero Status",
        "value": "Food Sorting Hero"
      },
      {
        "trait_type": "Network",
        "value": "Celo"
      },
      {
        "trait_type": "Reward Amount",
        "value": "1 G$"
      }
    ]
  };

  // Distribution Champion metadata  
  const distributionMetadata = {
    "name": "Pesia's Kitchen - Distribution Champion",
    "description": "Recognition for heroes who bridge the gap between abundance and need - directly delivering meals to families facing food insecurity. We deliver hope, not just food.",
    "image": imageUrl,
    "attributes": [
      {
        "trait_type": "Activity Type",
        "value": "Food Distribution"
      },
      {
        "trait_type": "Organization",
        "value": "Pesia's Kitchen"
      },
      {
        "trait_type": "Hero Status",
        "value": "Distribution Champion"
      },
      {
        "trait_type": "Network",
        "value": "Celo"
      },
      {
        "trait_type": "Reward Amount",
        "value": "2 G$"
      }
    ]
  };

  // Pickup Specialist metadata
  const pickupMetadata = {
    "name": "Pesia's Kitchen - Pickup Specialist", 
    "description": "Honoring the frontline warriors who intercept perfectly good food from waste streams and give it a second chance to nourish communities. Rescuing food, fighting hunger.",
    "image": imageUrl,
    "attributes": [
      {
        "trait_type": "Activity Type",
        "value": "Food Pickup"
      },
      {
        "trait_type": "Organization",
        "value": "Pesia's Kitchen"
      },
      {
        "trait_type": "Hero Status", 
        "value": "Pickup Specialist"
      },
      {
        "trait_type": "Network",
        "value": "Celo"
      },
      {
        "trait_type": "Reward Amount",
        "value": "1.5 G$"
      }
    ]
  };

  try {
    console.log('🚀 Creating and uploading activity-specific NFT metadata...\n');
    
    // Upload each metadata to IPFS
    const sortingHash = await uploadMetadataToIPFS(sortingMetadata, 'Food Sorting Hero');
    const distributionHash = await uploadMetadataToIPFS(distributionMetadata, 'Distribution Champion');  
    const pickupHash = await uploadMetadataToIPFS(pickupMetadata, 'Pickup Specialist');
    
    console.log('\n✅ All metadata uploaded successfully!');
    console.log('\n📋 Environment Variables to add:');
    console.log(`NFT_METADATA_URL_SORTING=https://ipfs.io/ipfs/${sortingHash}`);
    console.log(`NFT_METADATA_URL_DISTRIBUTION=https://ipfs.io/ipfs/${distributionHash}`);
    console.log(`NFT_METADATA_URL_PICKUP=https://ipfs.io/ipfs/${pickupHash}`);
    
    return {
      food_sorting: sortingHash,
      food_distribution: distributionHash, 
      food_pickup: pickupHash
    };
    
  } catch (error) {
    console.error('❌ Error creating activity metadata:', error);
    throw error;
  }
}

if (require.main === module) {
  createActivityMetadata().catch(console.error);
}

module.exports = { createActivityMetadata };