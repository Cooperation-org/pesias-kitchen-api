const fs = require('fs').promises;

async function saveMetadata() {
  const poolAttributes = {
    name: "Pesia's Kitchen",
    description: "A community-driven food rescue program that reduces food waste and ensures food security for vulnerable populations.",
    rewardDescription: "Earn G$ rewards for food rescue, sorting, and distribution activities",
    website: "https://www.pesiaskitchen.org",
    headerImage: "https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=1200",
    logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
  };
  
  await fs.writeFile('pool-metadata.json', JSON.stringify(poolAttributes, null, 2));
}

saveMetadata().catch(console.error);