const {ethers } = require('hardhat')

/**
 * 
 * so before getting the contract you need to run your node like
 * 
 * $ yarn hardhat node
 * 
 * $ yarn hardhat run scripts/list-and-mint.js --network localhost 
 * 
 */
const cancelItem = async () => {

    const TOKEN_ID = 0;
    const accounts = await ethers.getSigners()
    const deployer = accounts[0]
    const nftMarketplaceContract = await ethers.getContract('NftMarketplace', deployer)
    const basicNftContract = await ethers.getContract('BasicNft', deployer)
    // console.log(basicNftContract)

    console.log("Cancelling .......")
    const tx = await nftMarketplaceContract.cancelListing(basicNftContract.getAddress(), TOKEN_ID)
    await tx.wait(1)
    console.log("Nft Cancelled");
}

cancelItem().then(
    () => process.exit(0)
).catch(error => {
    console.log(error)
    process.exit(0)
})