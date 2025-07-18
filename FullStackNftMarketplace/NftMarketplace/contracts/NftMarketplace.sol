// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


error NftMarketplace__NotApprovedForMarketPlace();
error NftMarketplace__AlreadyListed(address nftAddress,uint256 tokenId);
error NftMarketplace__PriceMustBeAboveZero();
error NftMarketplace__NotOwner();
error NftMarketplace__NotListed(address nftAddress, uint256 tokenId);
error NftMarketplace__PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);
error NftMarketplace__NoProceeds();
error NftMarketplace__TransferFail();

contract NftMarketplace is ReentrancyGuard {
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
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );
    event ItemCancelled(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId
    );

    /**
     * 
     * Modifiers
     * 
     */
    modifier notListed(address nftAddress, uint256 tokenId,address sender) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if(listing.price > 0) {
            revert NftMarketplace__AlreadyListed(nftAddress, tokenId);
        }
        _;
    }
    
    modifier isOwner(address nftAddress, uint256 tokenId, address spender) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if(owner != spender) {
            revert NftMarketplace__NotOwner();
        }
        _;
    }
    
    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if(listing.price <= 0) {
            revert NftMarketplace__NotListed(nftAddress, tokenId);
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
            revert NftMarketplace__PriceMustBeAboveZero();
        }
        IERC721 nft = IERC721(nftAddress);
        if(nft.getApproved(tokenId) != address(this)) {
            revert NftMarketplace__NotApprovedForMarketPlace();
        }
        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem(
        address nftAddress,
        uint256 tokenId
    )  
        external payable 
        isListed(nftAddress, tokenId) 
        nonReentrant()
    {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if(msg.value < listing.price) {
            revert NftMarketplace__PriceNotMet(nftAddress, tokenId, msg.value);
        }

        // Sending the money to owner
        s_proceeds[listing.seller] = s_proceeds[listing.seller] + listing.price;
        delete (s_listings[nftAddress][tokenId]);
        IERC721(nftAddress).safeTransferFrom(listing.seller, msg.sender, tokenId);

        // Emit event
        emit ItemBought(msg.sender, nftAddress, tokenId, listing.price);
    }

    function cancelListing(
        address nftAddress,
        uint256 tokenId
    ) external isOwner(nftAddress, tokenId, msg.sender) {
        delete( s_listings[nftAddress][tokenId]);
        emit ItemCancelled(msg.sender, nftAddress, tokenId);
    }

    function updateListing(
        address nftAddress, 
        uint256 tokenId,
        uint256 newPrice
    ) external 
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    function withdrawProceeds() external  {
        uint256 proceeds = s_proceeds[msg.sender];
        if(proceeds <= 0) {
            revert NftMarketplace__NoProceeds();
        }
        s_proceeds[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: proceeds}('');
        if(!success) {
            revert NftMarketplace__TransferFail();
        }
    }

    /**
     * 
     * Getters
     * 
     */
    function getListing(address nftAddress, uint256 tokenId) external view returns(Listing memory) {
        return s_listings[nftAddress][tokenId];
    }

    function getProceed(address sender) external view returns(uint256) {
        return s_proceeds[sender];
    }
}