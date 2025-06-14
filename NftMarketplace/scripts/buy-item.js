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
const buyItem = async () => {

    const TOKEN_ID = 1;
    const accounts = await ethers.getSigners()
    const deployer = accounts[0]
    const nftMarketplaceContract = await ethers.getContract('NftMarketplace', deployer)
    const basicNftContract = await ethers.getContract('BasicNft', deployer)
    // console.log(basicNftContract)

    console.log("Buying .......")
    const listing = await nftMarketplaceContract.getListing(basicNftContract.getAddress(), TOKEN_ID)
    const price = listing.price.toString()
    const tx = await nftMarketplaceContract.buyItem(basicNftContract.getAddress(), TOKEN_ID, {value: price})
    await tx.wait(1)
    console.log("Nft Bought");
}

buyItem().then(
    () => process.exit(0)
).catch(error => {
    console.log(error)
    process.exit(0)
})