import Blockchain from "./Blockchain";
import { BlockType, TransactionType } from "./type";
import { calculateHash, makeHash, serializeTransaction, sleep } from "./utils";
import { MerkleTree } from 'merkletreejs';

class Miner {
    private blockchain : Blockchain;
    private minerAddress : string;
    private isMining: boolean = false;
    private currentDifficulty : number = 2;
    private maxAttempt : number = 10000;
    constructor(blockchain: Blockchain, minerAddress: string) {
        this.blockchain = blockchain;
        this.minerAddress = minerAddress;
    }

    public async startMining() {
        this.isMining = true;
        console.log(`Miner started mining...`);
        while (this.isMining) {
            try {
                const block = await this.mineBlock();
                if (block) {
                    console.log(`Block mined: ${JSON.stringify(block)}`);
                }
            } catch (error) {
                console.error(`Mining error: ${error.message}`);
            }
            // Optional: Sleep to avoid busy-waiting
            await sleep(1000).then(() => {
                console.log(`Miner is still mining...`);
            })
        }
    }

    public async mineBlock() : Promise<BlockType | null>{
        const pendingTransactions = this.blockchain.getPendingTransactions()
        if(pendingTransactions.length === 0) {
            console.log(`No pending transactions to mine`)
            return null;
        }

        const lastBlock = this.blockchain.getLatestBlock()
        const index = lastBlock.index + 1;
        const prevHash = lastBlock.hash;
        const timestamp = Date.now();

        // Finding nonce
        const { nonce, hash } = this.proofOfWork(index, prevHash, timestamp, pendingTransactions)
        
        // Merkle Root
        const merkleRoot = this.calculateMerkleRoot(pendingTransactions)
        console.log("heyy merkleRoot")
        // Preparing Block
        const newBlock = this.blockchain.createBlock(index, prevHash, hash, timestamp, merkleRoot, pendingTransactions, nonce, this.currentDifficulty)
        
        const addBlock = this.blockchain.addBlock(newBlock);
        if (!addBlock) {
            console.error(`Failed to add block: ${JSON.stringify(newBlock)}`);
            return null;
        }
        
        return newBlock;
    }

    public stopMining() {
        this.isMining = false;
        console.log(`Miner ${this.minerAddress} stopped mining.`);
    }

    private proofOfWork (index: number, prevHash: string, timestamp : number, transactions: TransactionType[]): {nonce : number, hash: string} {
        let nonce = 0;
        const prefix = '0'.repeat(this.currentDifficulty);
        while (this.isMining && this.maxAttempt--) {
            const hash = calculateHash(index, prevHash, timestamp, transactions, nonce);
            if (hash.startsWith(prefix)) {
                this.maxAttempt = 10000; // Reset max attempts after a successful nonce
                return { nonce, hash };
            }
            nonce++;
            // console.log(this.maxAttempt)
        }
        this.maxAttempt = 10000; // Reset max attempts after failure
        throw new Error('Nonce not found within max attempts Or Interrupted');
    }

    private calculateMerkleRoot(transactions : TransactionType[]): string {
        const leaves = transactions.map(tx => makeHash(serializeTransaction(tx)))
        const merkleTree = new MerkleTree(leaves, makeHash, { sortPairs: true });
        return merkleTree.getRoot().toString('hex');
    }

}
export default Miner