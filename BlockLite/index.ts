import Blockchain from "./Blockchain";
import Wallet from "./Wallet";
import Miner from "./Miner";

const blockchain = new Blockchain();

// Create a miner instance
const minerWallet = new Wallet()
const miner = new Miner(blockchain, minerWallet.getAddress());

// Start mining
miner.startMining();

setTimeout(() => {

    const wallet1 = new Wallet();
    const wallet2 = new Wallet();
    const wallet3 = new Wallet();
    
    blockchain.addBalance(wallet1.getAddress(), 1000);
    blockchain.addBalance(wallet2.getAddress(), 1000);
    
    wallet1.sendTransaction(wallet2.getAddress(), 100, blockchain);
    wallet2.sendTransaction(wallet3.getAddress(), 50, blockchain);
}, 5000) // send transaction after 10 seconds


process.on('SIGINT', () => {
    console.log('Shutting down miner...');
    miner.stopMining?.(); // implement if needed
    process.exit();
});


