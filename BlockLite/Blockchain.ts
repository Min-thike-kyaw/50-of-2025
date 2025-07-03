import { BlockType, TransactionType } from "./type";
import { calculateHash, calculateMerkleRoot, makeHash, serializeTransaction } from "./utils";
import elliptic from 'elliptic';
const EC = elliptic.ec;
import * as fs from 'fs';


class Blockchain {
    private chain : BlockType[];
    private memPool: BlockType[];
    private pendingTransactions: TransactionType[];
    private balances: { [key: string]: number };
    private nonces: { [key: string]: number };
    private ec = new EC('secp256k1'); // same as Bitcoin/Ethereum
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.memPool = [];
        this.balances = {};
        this.nonces = {};
        this.pendingTransactions = [];
        this.memPool = []
    }

    private createGenesisBlock (): BlockType {
        const timestamp = Date.now();
        const transactions: TransactionType[] = [];
        const merkleRoot = '0';
        const { nonce, hash } = this.findNonce(0, '0', timestamp, transactions);
        return this.createBlock(0, '0', hash, timestamp, merkleRoot, transactions, nonce, 2);
    };

    createBlock = (index: number, prevHash: string, hash: string,timestamp: number, merkleRoot: string,transactions: TransactionType[], nonce: number, difficulty: number): BlockType => {
        return {
            index,
            prevHash,
            timestamp,
            hash,
            merkleRoot,
            transactions,
            difficulty,
            nonce
        };
    };

    private findNonce (index: number, prevHash: string, timestamp : number, transactions: TransactionType[], difficulty: number = 2, maxAttempt: number = 10000): {nonce : number, hash: string} {
        let nonce = 0;
        const prefix = '0'.repeat(difficulty);
        while (maxAttempt--) {
            const hash = calculateHash(index, prevHash, timestamp, transactions, nonce);
            if (hash.startsWith(prefix)) {
                return { nonce, hash };
            }
            nonce++;
        }
        throw new Error('Nonce not found within max attempts');
    }

    createTransaction(tx: TransactionType): TransactionType {
        if (!this.validateTransaction(tx)) throw new Error("Invalid transaction");
        this.pendingTransactions.push(tx);
        fs.writeFileSync('pendingTransactions.json', JSON.stringify(this.pendingTransactions, null, 2));
        return tx;
    }

    /**
     * Validates a transaction based on its signature, nonce, and sender's balance.
     * @param tx - The transaction to validate.
     * @returns {boolean} - Returns true if the transaction is valid, false otherwise.
     */

    validateTransaction(tx: TransactionType): boolean {
        // Check if the transaction has a valid signature
        if (!tx.signature) return false; // Signature is required for validation

        // Check if the nonce matches the expected value
        if ((this.nonces[tx.from] || 0) !== tx.nonce) return false;

        // Check if the transaction amount is positive
        if (tx.amount <= 0) return false;

        // Check if the sender and receiver addresses are valid
        if (!tx.from || !tx.to || tx.from !== tx.to) return false; // Both addresses must be present
        
        // Check if the nonce is duplicate in the pending transactions
        if (this.pendingTransactions.some(pendingTx => pendingTx.from === tx.from && pendingTx.nonce === tx.nonce)) {
            return false; // Duplicate nonce in pending transactions
        }

        // Check if the sender has sufficient balance
        if (this.getBalance(tx.from) < tx.amount) return false;

        // Verify the transaction signature
        if (!this.verifySignature(tx)) return false;

        // If all checks pass, return true
        return true;
    }

    verifySignature (transaction: TransactionType): boolean {
        if (!transaction.signature) {
            console.error('Transaction signature is missing');
            return false;
        }
        const key = this.ec.keyFromPublic(transaction.from, 'hex');
        const txData = { ...transaction };
        delete txData.signature; // Remove signature for verification
        const txHash = makeHash(serializeTransaction(txData));
        return key.verify(txHash, transaction.signature);
    }


    addBlock(block: BlockType): boolean {
        const lastBlock = this.getLatestBlock();
        console.log(lastBlock)
        console.log(block)
        console.log("failed")
        if(block.transactions.length === 0) return false;
        if(block.prevHash !== lastBlock.hash ) return false;
        if(block.index !== lastBlock.index + 1) return false;
        console.log("heyy")
        if(block.hash !== calculateHash(block.index, block.prevHash, block.timestamp, block.transactions, block.nonce)) return false;
        if(block.merkleRoot !== calculateMerkleRoot(block.transactions)) return false;
        if(block.difficulty < 1 || !block.hash.startsWith('0'.repeat(block.difficulty))) return false;

        this.handleTransactions(block.transactions);
        this.chain.push(block);

        // Clear pending transactions after adding the block
        this.pendingTransactions = this.pendingTransactions.filter(tx => !block.transactions.some(bTx => bTx.from === tx.from && bTx.to === tx.to && bTx.amount === tx.amount && bTx.nonce === tx.nonce)); 
        // this.pendingTransactions = []

        // Save the blockchain to a file
        fs.writeFileSync('blockchain.json', JSON.stringify(this.chain, null, 2));
        
        return true;
    }

    handleTransactions(transactions: TransactionType[]) {
        for (const tx of transactions) {
            // Update balances and nonces
            this.transferBalance(tx.from, tx.to, tx.amount);
            this.addNonce(tx.from);
        }
    }

    transferBalance(from: string, to : string, amount : number) {
        if (this.getBalance(from) < amount) throw new Error("Insufficient balance");
        this.balances[from] -= amount;
        this.balances[to] = (this.balances[to] || 0) + amount;
    }
    private addNonce(from: string) {
        this.nonces[from] = (this.nonces[from] || 0) + 1;
    }

    // Adds balance to the specified address for testing purposes
    addBalance = (from: string, amount: number) => {
        this.balances[from] = (this.balances[from] + 0) ||  amount;
    }

    getBalance = (from: string) => {
        return this.balances[from] || 0;
    }

    getPendingTransactions(): TransactionType[] {
        return this.pendingTransactions;
    }

    getLatestBlock(): BlockType {
        return this.chain[this.chain.length - 1];
    }

    getNonce (from: string): number {
        return this.nonces[from] || 0;
    }
}

export default Blockchain