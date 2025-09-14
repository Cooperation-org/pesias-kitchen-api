const { ethers } = require('ethers');

// Simple NFT minting service for Pesia Kitchen NFT contract
class PesiaKitchenNFTService {
  constructor(provider, wallet, contractAddress) {
    this.provider = provider;
    this.wallet = wallet;
    this.contractAddress = contractAddress;
    
    // Simple ERC721 ABI for minting
    this.abi = [
      'function mint(address to, string memory tokenURI) public returns (uint256)',
      'function mintWithMetadata(address to, string memory eventTitle, string memory activityType, string memory pseudonymousId, uint256 timestamp) public returns (uint256)',
      'function totalSupply() public view returns (uint256)',
      'function ownerOf(uint256 tokenId) public view returns (address)',
      'function tokenURI(uint256 tokenId) public view returns (string)',
      'event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI)'
    ];
    
    this.contract = new ethers.Contract(contractAddress, this.abi, provider);
    this.contractWithSigner = this.contract.connect(wallet);
  }
  
  async mintNFT(to, eventTitle, activityType, pseudonymousId, timestamp) {
    try {
      console.log('Minting NFT to:', to);
      console.log('Event:', eventTitle);
      console.log('Type:', activityType);
      console.log('Pseudonymous ID:', pseudonymousId);
      
      const tx = await this.contractWithSigner.mintWithMetadata(
        to,
        eventTitle,
        activityType,
        pseudonymousId,
        timestamp,
        { gasLimit: 500000 }
      );
      
      console.log('NFT minting transaction:', tx.hash);
      const receipt = await tx.wait();
      
      // Extract token ID from event
      let tokenId = null;
      if (receipt.events) {
        const mintEvent = receipt.events.find(event => 
          event.event === 'NFTMinted' && event.args && event.args.tokenId
        );
        if (mintEvent) {
          tokenId = mintEvent.args.tokenId.toString();
        }
      }
      
      console.log('NFT minted successfully!');
      console.log('Token ID:', tokenId);
      console.log('Transaction hash:', receipt.transactionHash);
      
      return {
        success: true,
        tokenId: tokenId,
        txHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString()
      };
      
    } catch (error) {
      console.error('NFT minting failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async getNFTDetails(tokenId) {
    try {
      const owner = await this.contract.ownerOf(tokenId);
      const tokenURI = await this.contract.tokenURI(tokenId);
      
      return {
        tokenId,
        owner,
        tokenURI
      };
    } catch (error) {
      console.error('Error getting NFT details:', error.message);
      return null;
    }
  }
  
  async getTotalSupply() {
    try {
      return await this.contract.totalSupply();
    } catch (error) {
      console.error('Error getting total supply:', error.message);
      return 0;
    }
  }
}

module.exports = PesiaKitchenNFTService;
