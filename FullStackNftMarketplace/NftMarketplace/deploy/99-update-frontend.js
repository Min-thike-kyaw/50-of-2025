const { ethers, network } = require("hardhat")
const fs = require('fs')

const frontendContractFile = "../nextjs-nft-marketplace/constants/networkMapping.json"
const frontendAbiLocation = "../nextjs-nft-marketplace/constants/";
module.exports = async function() {
    if(process.env.UPDATE_FRONT_END) {
        await updateContractAddresses()
        await updateAbi()
    }
}

async function updateAbi() {
    const nftMarketplace = await ethers.getContract('NftMarketplace')
    fs.writeFileSync(`${frontendAbiLocation}NftMarketplace.json`, nftMarketplace.interface.formatJson())

    const basicNft = await ethers.getContract('BasicNft')
    fs.writeFileSync(`${frontendAbiLocation}BasicNft.json`, basicNft.interface.formatJson())
}
async function updateContractAddresses() {
    const nftMarketplace = await ethers.getContract('NftMarketplace')
    const chainId = network.config.chainId
    const contractAddresses = JSON.parse(fs.readFileSync(frontendContractFile, 'utf8'))
    const address = await nftMarketplace.getAddress()
    if(chainId in contractAddresses) {
        if(!contractAddresses[chainId]["NftMarketplace"].includes(address)) {
            contractAddresses[chainId]["NftMarketplace"].push(address)
        }
    } else {
        contractAddresses[chainId] = {"NftMarketplace": [address]}
    }
    fs.writeFileSync(frontendContractFile,JSON.stringify(contractAddresses))
}
module.exports.tags = ['all','frontend']