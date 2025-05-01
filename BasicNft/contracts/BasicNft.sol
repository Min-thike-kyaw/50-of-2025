// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";


contract BasicNft is ERC721
{
    uint256 private sTokenCounter;
    string public constant TOKEN_URI =
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";
    constructor() ERC721("Doggie", "Dog") {
        sTokenCounter = 0;
    }

    function mintNft() public {
        _safeMint(msg.sender, sTokenCounter);
        sTokenCounter += 1;
    }

    function tokenURI(
        uint256  /** tokenId */
    ) public view override returns (string memory) {
        return TOKEN_URI;
    }

    function getTokenCounter() public view returns (uint256) {
        return sTokenCounter;
    }

}