const { ethers } = require("ethers")
const fs = require("fs")
// require("../constants/NftMarketplace.json")
const ABI = JSON.parse(fs.readFileSync("./constants/NftMarketplace.json", "utf8"))

// Connect to Hardhat RPC
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545")

// Contract address from your local deployment
const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3"

const contract = new ethers.Contract(contractAddress, ABI, provider)

contract.on("ItemListed", (seller, nftAddress, tokenId, price, event) => {
  console.log("Event received:")
  console.log("Seller:", seller)
  console.log("Nft Address:", nftAddress)
  console.log("Token ID:", tokenId.toString())
  console.log("Price:", price.toString())
  console.log("Tx Hash:", event)

  // Optional: Store to DB here
})
