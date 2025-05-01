// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const {networks}  = require('../../hardhat.config.js');
const { storeImages, storeTokenUriMetadata } = require("../../utils/pinata.js");
const { network, ethers } = require("hardhat");

module.exports = buildModule("RandomIpfsNft",async (m) => {
  if(process.env.UPLOAD_TO_PINATA) {
    tokenUris = await handleTokenUris();
  }
  // Get chain ID
  const chainId = m.getChainId();
  console.log("Deploying to chain ID:", chainId);
  const vrfCoordinator = networks[chainId].vrfCoordinator
  const subscriptionId = networks[chainId].subscriptionId
  const gasLane = networks[chainId].gasLane
  const callbackGasLimit = networks[chainId].callbackGasLimit
  const mintFee = networks[chainId].mintFee
  const args = [
    vrfCoordinator,
    subscriptionId,
    gasLane,
    callbackGasLimit,
    mintFee,
    tokenUris
  ]
  const RandomIpfsNft = m.contract("RandomIpfsNft", args);

  return { RandomIpfsNft };
});


