import Blockchain from "./Blockchain";
import Wallet from "./Wallet";
import Miner from "./Miner";
import Network from "./Network";
import wallets from './wallets.json';

const blockchain = new Blockchain();
const network = new Network(blockchain)
// Create a miner instance
const minerWallet = new Wallet()
const miner = new Miner(blockchain, minerWallet.getAddress(), network);
// Initialize the network
network.init();

// Start mining
// miner.startMining();

let interval = setInterval(() => {

    const wallet1 = new Wallet(wallets["Bob"].privateKey);
    const wallet2 = new Wallet(wallets["Alice"].privateKey);
    const wallet3 = new Wallet(wallets["Charlie"].privateKey);
    
    
    wallet1.sendTransaction(wallet2.getAddress(), 100, blockchain, network);
    wallet2.sendTransaction(wallet3.getAddress(), 50, blockchain, network);
}, 5000) // send transaction after 10 seconds


process.on('SIGINT', () => {
    console.log('Shutting down miner...');
    miner.stopMining?.();
    clearInterval(interval);
});


