const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const fs = require('fs')
const { verify } = require("../utils/verify")


module.exports = async ({getNamedAccounts , deployment}) => {
    const {deploy , log} = deployment
    const {deployer} = await getNamedAccounts()

    const chainId = network.config.chainId
    let priceFeedAddress;
    if(chainId == 11155111) {
        priceFeedAddress = networkConfig[chainId].ethUsdPriceFeed
    }

    const lowSVG = fs.readFileSync("./images/dynamicNft/frown.svg", { encoding: "utf8" })
    const highSVG = fs.readFileSync("./images/dynamicNft/happy.svg", { encoding: "utf8" })

    log("----------------------------------------------------")
    const arguments = [priceFeedAddress, lowSVG, highSVG]

    const dynamicSvgNft = await deploy('DynamicSvgNft', {
        from : deployer,
        args : arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(dynamicSvgNft.address, arguments)
    }
}