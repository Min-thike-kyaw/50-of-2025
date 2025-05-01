// Only ok for sepolia network
const { network } = require("hardhat")
const { storeImages, storeTokenUriMetadata } = require("../utils/pinata")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
      {
        trait_type: "cuteness",
        value: 100
      }
    ]
  }

async function handleTokenUris() {
    const tokenUris = []
  
    const {responses, files} = await storeImages('images')
    for(responseIndex in responses) {
      const metadata = {...metadataTemplate}
      metadata.name = files[responseIndex].replace('.png', "")
      metadata.description = `An adorable ${metadata.name}`
      metadata.image = `https://ipfs.io/ipfs/${responses[responseIndex].cid}`
      console.log(`Uploading ${metadata.name}`)
  
      const tokenUri = await storeTokenUriMetadata(metadata)
      tokenUris.push(`ipfs://${tokenUri.cid}`)
    }
    return tokenUris;
  }

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    log(`deployer ${deployer}`)
    // return;
    let tokenUris;
    if (process.env.UPLOAD_TO_PINATA == "true") {
        log('Hanldling Token URIS');
        tokenUris = await handleTokenUris()
        log("Finishing Token URIS")
    }
    const chainId = network.config.chainId
    let vrfCoordinator,subscriptionId,gasLane,callbackGasLimit,mintFee
    if(chainId === 11155111) {
        vrfCoordinator = networkConfig[chainId].vrfCoordinator
        subscriptionId = BigInt(networkConfig[chainId].subscriptionId)
        gasLane = networkConfig[chainId].gasLane
        callbackGasLimit = networkConfig[chainId].callbackGasLimit
        mintFee = networkConfig[chainId].mintFee
    }

    const args = [
        vrfCoordinator,
        subscriptionId,
        gasLane,
        callbackGasLimit,
        mintFee,
        tokenUris
    ]

    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args,
        log: true, 
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`Deployed at ${randomIpfsNft.address}`)


    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(randomIpfsNft.address, args)
    }
}

module.exports.tags = ["all", "randomipfs", "main"]
