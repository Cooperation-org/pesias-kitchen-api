// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract PesiaKitchenNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    string private _baseTokenURI;
    
    // Event for tracking minting
    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    
    constructor() ERC721("Pesia Kitchen Impact NFT", "PKI") {}
    
    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    function mint(address to, string memory tokenURI) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        
        // Store custom token URI if provided
        if (bytes(tokenURI).length > 0) {
            _setTokenURI(tokenId, tokenURI);
        }
        
        emit NFTMinted(to, tokenId, tokenURI);
        return tokenId;
    }
    
    function mintWithMetadata(
        address to, 
        string memory eventTitle,
        string memory activityType,
        string memory pseudonymousId,
        uint256 timestamp
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        
        // Create metadata URI with embedded data
        string memory metadataURI = string(abi.encodePacked(
            _baseTokenURI,
            "?event=", eventTitle,
            "&type=", activityType,
            "&id=", pseudonymousId,
            "&timestamp=", _toString(timestamp)
        ));
        
        _setTokenURI(tokenId, metadataURI);
        
        emit NFTMinted(to, tokenId, metadataURI);
        return tokenId;
    }
    
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
