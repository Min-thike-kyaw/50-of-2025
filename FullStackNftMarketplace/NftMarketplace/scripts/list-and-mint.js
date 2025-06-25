const {ethers, deployments } = require('hardhat')

const PRICE = ethers.parseEther('0.1')

/**
 * 
 * so before getting the contract you need to run your node like
 * 
 * $ yarn hardhat node
 * 
 * $ yarn hardhat run scripts/list-and-mint.js --network localhost 
 * 
 */
const mintAndList = async () => {
    const accounts = await ethers.getSigners()
    const deployer = accounts[0]
    const nftMarketplaceContract = await ethers.getContract('NftMarketplace', deployer)
    const basicNftContract = await ethers.getContract('BasicNft', deployer)
    // console.log(basicNftContract)

    console.log("Minting .......")
    const mintTrx = await basicNftContract.mintNft();
    const mintTrxRecept = await mintTrx.wait(1);
    // console.log(mintTrxRecept.logs)
    const logs = mintTrxRecept.logs
    .map(log => {
        try {
        return basicNftContract.interface.parseLog(log)
        } catch (e) {
        return null
        }
    })
    .find(event => event && event.name == "DogMinted");
    console.log(logs?.args?.tokenId)
    const tokenId = logs?.args?.tokenId
    console.log("Minted")

    console.log("Approving...")
    const approveTrx = await basicNftContract.approve(await nftMarketplaceContract.getAddress(), tokenId)
    await approveTrx.wait(1)
    console.log("Approved")

    console.log("Listing.....")
    const listTrx = await nftMarketplaceContract.listItem(await basicNftContract.getAddress(), tokenId, PRICE)
    await listTrx.wait(1);
    console.log("Listed")
}

mintAndList().then(
    () => process.exit(0)
).catch(error => {
    console.log(error)
    process.exit(0)
})