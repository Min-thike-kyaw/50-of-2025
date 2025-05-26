const networkConfig = {
    11155111: {
        name: "sepolia",
        vrfCoordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        blockConfirmations: 6,
        subscriptionId: "101426619259465271193858684025400389244565929531876348031425395359225693622819",
        gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c", // 30 gwei
        callbackGasLimit: "40000",
        mintFee: "10000000000000000",
        ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306"
      },
}

const developmentChains = ['localhost', 'hardhat']

module.exports = {
    networkConfig,
    developmentChains
}