// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
// The new-version of "@openzeppelin/contracts": "^5.0.1", already has Base64.sol
// You can import it like as shown just below...
// import "@openzeppelin/contracts/utils/Base64.sol";   // 👈 comment in this import
// instead of installing "base64-sol": "^1.1.0",
import "base64-sol/base64.sol"; 

pragma solidity ^0.8.20;
error ERC721Metadata__URI_QueryFor_NonExistentToken();

contract DynamicSvgNft is ERC721 , Ownable {

    AggregatorV3Interface internal immutable i_priceFeed;
    uint256 private s_tokenCounter;
    string s_lowImageURI;
    string s_highImageURI;

    mapping(uint256 => int256) private sTokenIdToHighValue; 
    event CreatedNFT(uint256 indexed tokenId, int256 highValue);

    
    constructor(
        address aggregatorAddress,
        string memory highSvg,
        string memory lowSvg
    ) ERC721 ("DynamicSvgNft", "DSN") Ownable(msg.sender) {
        s_tokenCounter = 0;
        i_priceFeed = AggregatorV3Interface(aggregatorAddress);
        s_lowImageURI = svgToImageURI(lowSvg);
        s_highImageURI = svgToImageURI(highSvg);
    }

    function svgToImageURI(string memory svg) public pure returns (string memory) {
        string memory baseURL = "data:image/svg+xml;base64,";
        string memory base64Coded = Base64.encode(bytes(string(abi.encodePacked(svg))));
        return string(abi.encodePacked(baseURL, base64Coded));
    }

    function mintNft(int256 highValue) public {
        uint256 sNewToken = s_tokenCounter;
        sTokenIdToHighValue[sNewToken] = highValue;
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter += 1;
        emit CreatedNFT(sNewToken, highValue);
    }

    function _baseURI() internal pure override returns(string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if(!_exists(tokenId)) {
            revert ERC721Metadata__URI_QueryFor_NonExistentToken();
        }
        
        (, int256 price, , , ) = i_priceFeed.latestRoundData();
        string memory imageURI = s_lowImageURI;
        if(price > sTokenIdToHighValue[tokenId]) {
            imageURI = s_highImageURI;
        }
        return string(
            abi.encodePacked(
                _baseURI(),
                Base64.encode(
                    bytes(
                        abi.encodePacked(
                            '{ "name": "Dynamic SVG", "description": "Dynamic SVG based on price", "image": "',
                            imageURI,
                            '", "attributes": [{"trait_type": "coolness", "value": 100}]'
                            '}'
                        )
                    )
                )
            )
        );
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
      return sTokenIdToHighValue[tokenId] != 0;
    }


    function getLowSVG() public view returns (string memory) {
        return s_lowImageURI;
    }

    function getHighSVG() public view returns (string memory) {
        return s_highImageURI;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return i_priceFeed;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
    
}