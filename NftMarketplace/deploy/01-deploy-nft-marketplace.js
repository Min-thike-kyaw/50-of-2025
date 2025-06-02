//Fix To deploy , Remove type: module
const { network } = require('hardhat')
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require('../utils/verify');

module.exports = async({getNamedAccounts, deployments}) => {
    const {deploy, log} = deployments;
    const { deployer } = await getNamedAccounts();
    const waitBlockConfirmations = developmentChains.includes(network.name) ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS;

    const args = [];

    log(`-------- Deploying to ${network.name} -------`)
    const nftMarketplace = await deploy("NftMarketplace", {
        from : deployer,
        args: args,
        log: true,
        waitConfirmations: waitBlockConfirmations,
    })

    log('----- Deployment Done -----')
    
    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log('------- Verifying -------')
        await verify(nftMarketplace.address, args)
        log('------- Verification Done -------')

    }
    log('--------- Done -------')
}

module.exports.tags = ['all', 'nftMarketplace']

