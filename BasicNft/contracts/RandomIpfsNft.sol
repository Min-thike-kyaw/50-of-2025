// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

error RandomIpfsNft__RangeOutOfBounds();
error RandomIpfsNft__AlreadyInitialized();
error RandomIpfsNft__NeedMoreETHSent();
error RandomIpfsNft__TransferFailed();

contract RandomIpfsNft is VRFConsumerBaseV2Plus, ERC721URIStorage
{
    // NFT Types
    enum Breed {
        PUG,
        SHIBA,
        BERNARD
    }

    // Request ID <=> Sender
    mapping(uint256 => address) public s_requestIdToSender;

    // Chainlink VRF Variable
    VRFCoordinatorV2Interface private immutable COORDINATOR;
    uint256 i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private immutable requestConfirmations = 3;
    uint32 private immutable numWords = 2;
    bytes32 private immutable i_gasLane;

    //NFT Variables
    uint256 internal constant MAX_CHANCE_VALUE=100;
    uint256 private s_tokenCounter;
    string[3] internal s_dogTokenUris;
    bool private s_initialized;
    uint256 private immutable i_mintFee;

    // Events
    event RequestNFt(uint256 requestId, address sender);
    event NftMinted(uint256 tokenId,Breed dog, address dogOwner);
    constructor(
        address vrfCoordinator,
        uint256 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        uint256 mintFee,
        string[3] memory dogTokenUris
    )
        VRFConsumerBaseV2Plus(vrfCoordinator)
        // ConfirmedOwner(msg.sender)
        ERC721("Random IPFS NFT", "RIN") 
    {
        COORDINATOR = VRFCoordinatorV2Interface(
            vrfCoordinator
        );
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        _initializeContract(dogTokenUris);
        i_mintFee = mintFee;
        s_tokenCounter = 0;
    }

    function requestNft() public payable returns(uint256 requestId) {
        if(msg.value < i_mintFee) {
            revert RandomIpfsNft__NeedMoreETHSent(); 
        }
        // requestId = s_vrfCoordinator.requestRandomWords(
        //     i_gasLane,
        //     i_subscriptionId,
        //     requestConfirmations,
        //     i_callbackGasLimit,
        //     numWords
        // );

        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: i_gasLane,
                subId: i_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: i_callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({
                        nativePayment: true
                    })
                )
            })
        );
        s_requestIdToSender[requestId] = msg.sender;
        emit RequestNFt(requestId, msg.sender);
    }

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] calldata _randomWords
    ) internal override {
        address dogOwner = s_requestIdToSender[_requestId];
        uint256 tokenId = s_tokenCounter;
        s_tokenCounter += 1;
        uint256 moddedRng = _randomWords[0] % MAX_CHANCE_VALUE;
        Breed dog = getBreedFromModdedRng(moddedRng);
        _safeMint(dogOwner, tokenId);
        _setTokenURI(tokenId, s_dogTokenUris[uint256(dog)]);
        emit NftMinted(tokenId, dog, dogOwner);
    }

    function getBreedFromModdedRng(uint256 moddedRng) public pure returns (Breed) {
        uint256 cumulativeSum = 0;
        uint256[3] memory chanceArray = getChanceArray();
        for (uint i = 0; i < chanceArray.length; i++) {
            // Pug = 0 - 9  (10%)
            // Shiba = 10 - 39  (30%)
            // Bernard = 40 = 99 (60%)
            if(moddedRng >= cumulativeSum && moddedRng < chanceArray[i]) {
                return Breed(i);
            }
            cumulativeSum += chanceArray[i];
        }
        revert RandomIpfsNft__RangeOutOfBounds();
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE];
    }

    function _initializeContract(string[3] memory dogTokenUris) private {
        if (s_initialized) {
            revert RandomIpfsNft__AlreadyInitialized();
        }
        s_dogTokenUris = dogTokenUris;
        s_initialized = true;
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomIpfsNft__TransferFailed();
        }
    }

    function getDogTokenUris(uint256 index) public view returns (string memory) {
        return s_dogTokenUris[index];
    }

    function getInitialized() public view returns (bool) {
        return s_initialized;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

}