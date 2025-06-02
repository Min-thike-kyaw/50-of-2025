const {assert, expect} = require('chai');
const { network, deployments, getNamedAccounts, ethers } = require('hardhat')
const { developmentChains } = require('../../helper-hardhat-config');
const { bigint } = require('hardhat/internal/core/params/argumentTypes');
!developmentChains.includes(network.name) ? 
    describe.skip 
    : describe('NFT Marketplace Unit test', function () {
        let nftMarketplace, nftMarketplaceContract, basicNft, basicNftContract, deployer, player, nftMarketplaceDeployment, basicNftDeployment
        const PRICE = ethers.parseEther("0.1")
        const TOKEN_ID = 0

        beforeEach(async () => {
            // deployer = await getNamedAccounts().deployer
            // player = await getNamedAccounts().player
            const accounts = await ethers.getSigners()
            deployer = accounts[0]
            player = accounts[1]
            
            await deployments.fixture(['all'])

            nftMarketplaceDeployment = await deployments.get('NftMarketplace')
            basicNftDeployment = await deployments.get('BasicNft')

            nftMarketplace = await ethers.getContractAt('NftMarketplace', nftMarketplaceDeployment.address)
            basicNft = await ethers.getContractAt('BasicNft', basicNftDeployment.address)
            await basicNft.mintNft()
            await basicNft.approve(nftMarketplaceDeployment.address, TOKEN_ID)
        })

        
        it("can list and can be bought" , async () => {            
            await nftMarketplace.listItem(basicNftDeployment.address, TOKEN_ID, PRICE)
            
            let nftMarketplaceConnectPlayer = await nftMarketplace.connect(player)
            await nftMarketplaceConnectPlayer.buyItem(basicNftDeployment.address, TOKEN_ID , {
                value: PRICE
            })
            let newOwner = await basicNft.ownerOf(TOKEN_ID)
            let deployerProceed = await nftMarketplace.getProceed(deployer.address)
            assert(newOwner.toString() == player.address)
            assert(deployerProceed.toString() == PRICE.toString())
        })
    })

