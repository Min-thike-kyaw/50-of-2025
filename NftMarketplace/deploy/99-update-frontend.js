const { ethers, network } = require("hardhat")
const fs = require('fs')

const frontendContractFile = "../nextjs-nft-marketplace/constants/networkMapping.json"
module.exports = async function() {
    if(process.env.UPDATE_FRONT_END) {
        await updateContractAddresses()
    }
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