// This is for testing purposes only.

import Blockchain from "./Blockchain";
import Wallet from "./Wallet";

const blockchain = new Blockchain();
const wallet1 = new Wallet();
const wallet2 = new Wallet();
const wallet3 = new Wallet();

blockchain.addBalance(wallet1.getAddress(), 1000);
blockchain.addBalance(wallet2.getAddress(), 1000);

wallet1.sendTransaction(wallet2.getAddress(), 100, blockchain);
wallet2.sendTransaction(wallet3.getAddress(), 50, blockchain);

// Create transactions
// blockchain.createTransaction()
