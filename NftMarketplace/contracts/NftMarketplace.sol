// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
error NftMarketPlace__NotApprovedForMarketPlace();
error NftMarketPlace__AlreadyListed(address nftAddress,uint256 tokenId);
error NftMarketPlace__PriceMustBeAboveZero();
error NftMarketPlace__NotOwner();
error NftMarketPlace__NotListed(address nftAddress, uint256 tokenId);
error NftMarketPlace__PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);
contract NftMarketPlace {
    struct Listing {
        uint256 price;
        address seller;
    }
    mapping (address => mapping(uint256=> Listing)) private s_listings;
    mapping (address => uint256) private s_proceeds;
    
    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );
    event ItemBought(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    /**
     * 
     * Modifiers
     * 
     */
    modifier notListed(address nftAddress, uint256 tokenId,address sender) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if(listing.price > 0) {
            revert NftMarketPlace__AlreadyListed(nftAddress, tokenId);
        }
        _;
    }
    
    modifier isOwner(address nftAddress, uint256 tokenId, address spender) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if(owner != spender) {
            revert NftMarketPlace__NotOwner();
        }
        _;
    }
    
    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if(listing.price <= 0) {
            revert NftMarketPlace__NotListed(nftAddress, tokenId);
        }
        _;
    }

    /**
     * 
     * Main Functions
     * 
     */

    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external 
        notListed(nftAddress, tokenId, msg.sender) 
        isOwner(nftAddress, tokenId, msg.sender)
    {
        if(price <= 0) {
            revert NftMarketPlace__PriceMustBeAboveZero();
        }
        IERC721 nft = IERC721(nftAddress);
        if(nft.getApproved(tokenId) != address(this)) {
            revert NftMarketPlace__NotApprovedForMarketPlace();
        }
        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem(
        address nftAddress,
        uint256 tokenId
    )  external payable isListed(nftAddress, tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if(msg.value < listing.price) {
            revert NftMarketPlace__PriceNotMet(nftAddress, tokenId, msg.value);
        }

        // Sending the money to owner
        s_proceeds[msg.sender] = s_proceeds[msg.sender] + listing.price;
        delete (s_listings[nftAddress][tokenId]);
        IERC721(nftAddress).safeTransferFrom(listing.seller, msg.sender, tokenId);

        // Emit event
        emit ItemBought(msg.sender, nftAddress, tokenId, listing.price);
    }
}