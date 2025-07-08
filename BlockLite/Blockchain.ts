import { BlockType, TransactionType } from "./type";
import { calculateHash, calculateMerkleRoot, makeHash, serializeTransaction } from "./utils";
import elliptic from 'elliptic';
const EC = elliptic.ec;
import * as fs from 'fs';
import wallets from './wallets.json';


class Blockchain {
    private chain : BlockType[];
    private memPool: BlockType[];
    private pendingTransactions: TransactionType[];
    private balances: { [key: string]: number };
    private nonces: { [key: string]: number };
    private ec = new EC('secp256k1'); // same as Bitcoin/Ethereum
    constructor() {
        this.chain = [];
        this.memPool = [];
        this.balances = {};
        this.nonces = {};
        this.pendingTransactions = [];
        this.memPool = []
        this.addBlock(this.createGenesisBlock());
    }

    private createGenesisBlock (): BlockType {
        const timestamp = 1751972318483; // Fixed timestamp for the genesis block
        const transactions: TransactionType[] = [
            { from: '0', to: wallets["Bob"].publicKey, amount: 1000000, nonce: 0, signature: 'GENESIS' },
            { from: '0', to: wallets["Alice"].publicKey, amount: 1000000, nonce: 0, signature: 'GENESIS' },
            { from: '0', to: wallets["Charlie"].publicKey, amount: 1000000, nonce: 0, signature: 'GENESIS' },
            { from: '0', to: wallets["Dave"].publicKey, amount: 1000000, nonce: 0, signature: 'GENESIS' },
            { from: '0', to: wallets["Eve"].publicKey, amount: 1000000, nonce: 0, signature: 'GENESIS' }
        ];
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

    createTransaction(tx: TransactionType): TransactionType | null {
        if (!this.validateTransaction(tx)) return null;
        this.pendingTransactions.push(tx);
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
        if (!tx.from || !tx.to || tx.from === tx.to) return false; // Both addresses must be present
        

        // Check if the nonce is duplicate in the pending transactions
        if (this.pendingTransactions.some(pendingTx => pendingTx.from === tx.from && pendingTx.nonce === tx.nonce)) {
            console.log(`Duplicate nonce detected for ${tx.from} with nonce ${tx.nonce}`);
            return false; // Duplicate nonce in pending transactions
        }

        console.log(`Getting Balance for ${tx.from}`, this.getBalance(tx.from));
        // Check if the sender has sufficient balance
        if (this.getBalance(tx.from) < tx.amount) return false;

        console.log(`Sender balance: ${this.getBalance(tx.from)}, Transaction amount: ${tx.amount}`);

        console.log(`Verifying...`);
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
        if(lastBlock) { // if genesis block
            if(Number(process.env.PEER_PORT) == 6001) {
                console.log(`Adding block to chain: ${JSON.stringify(block)}`);
                console.log(`Last block: ${JSON.stringify(lastBlock)}`);
            }
            if(block.transactions.length === 0) return false;
            if(block.prevHash !== lastBlock.hash ) return false;
            if(block.index !== lastBlock.index + 1) return false;
            if(block.hash !== calculateHash(block.index, block.prevHash, block.timestamp, block.transactions, block.nonce)) return false;
            if(block.merkleRoot !== calculateMerkleRoot(block.transactions)) return false;
            if(block.difficulty < 1 || !block.hash.startsWith('0'.repeat(block.difficulty))) return false;
        }

        this.handleTransactions(block.transactions);
        this.chain.push(block);

        // Clear pending transactions after adding the block
        this.pendingTransactions = this.pendingTransactions.filter(tx => !block.transactions.some(bTx => bTx.from === tx.from && bTx.to === tx.to && bTx.amount === tx.amount && bTx.nonce === tx.nonce)); 
        // this.pendingTransactions = []

        // Save the blockchain to a file
        fs.writeFileSync('blockchain.json', JSON.stringify(this.chain, null, 2));
        

        return true;
    } // To ask about balance sync.

    replaceChain(newBlocks: BlockType[]): boolean {
        const currentChain = this.chain;
      
        // Check if incoming chain is longer
        if (newBlocks.length <= currentChain.length) {
          console.log("Received chain is not longer than current chain. Ignoring.");
          return false;
        }
      
        // Validate the incoming chain
        if (!this.isValidChain(newBlocks)) {
          console.log("Received chain is invalid. Ignoring.");
          return false;
        }
      
        console.log("Replacing current chain with new chain.");
        this.chain = newBlocks;
        this.rebuildStateFromChain(); // Rebuild balances and nonces from the new chain
        return true;
    }

    private rebuildStateFromChain() {
        this.balances = {};
        this.nonces = {};
      
        for (const block of this.chain) {
          for (const tx of block.transactions) {
            if (tx.from !== '0') {
                // Update balance
                this.balances[tx.from] -= tx.amount;
                this.balances[tx.to] = (this.balances[tx.to] || 0) + tx.amount;
    
                // Update nonce
                this.nonces[tx.from] = (this.nonces[tx.from] || 0) + 1; 
            } else {
                // Handle mining reward
                this.balances[tx.to] = (this.balances[tx.to] || 0) + tx.amount;
            }
          }
        }
      
        // Optionally reset pendingTransactions/mempool
        this.pendingTransactions = [];
      }

    private isValidChain(chain: BlockType[]): boolean {
        const genesis = this.getGenesisBlock(); // fixed genesis

        const receivedGenesis = chain[0];
        if (
            receivedGenesis.index !== genesis.index ||
            receivedGenesis.prevHash !== genesis.prevHash ||
            receivedGenesis.merkleRoot !== genesis.merkleRoot ||
            receivedGenesis.hash !== genesis.hash
        ) {
            console.log("Genesis block does not match.");
            return false;
        }

      
        for (let i = 1; i < chain.length; i++) {
          const current = chain[i];
          const prev = chain[i - 1];
      
          // Check if the block is properly linked
          if (current.prevHash !== prev.hash) return false;
      
          // Recalculate hash and merkle root
          const expectedHash = calculateHash(current.index, current.prevHash, current.timestamp, current.transactions, current.nonce);
          if (current.hash !== expectedHash) return false;
      
          const expectedMerkle = calculateMerkleRoot(current.transactions);
          if (current.merkleRoot !== expectedMerkle) return false;
        }
      
        return true;
      }
      
      

    handleTransactions(transactions: TransactionType[]) {
        for (const tx of transactions) {
            // Update balances and nonces
            // this.transferBalance(tx.from, tx.to, tx.amount);
            // this.addNonce(tx.from);
            if (tx.from !== '0') {
                // Update balance
                this.balances[tx.from] -= tx.amount;
                this.balances[tx.to] = (this.balances[tx.to] || 0) + tx.amount;
    
                // Update nonce
                this.nonces[tx.from] = (this.nonces[tx.from] || 0) + 1;
            } else {
                // Handle mining reward
                this.balances[tx.to] = (this.balances[tx.to] || 0) + tx.amount;
            }
    
        }
    }

    transferBalance(from: string, to : string, amount : number) {
        // if (this.getBalance(from) < amount) throw new Error("Insufficient balance");
        if (from !== '0') {
            this.balances[from] += amount;
            this.balances[to] -= amount;
        } else {
            this.balances[to] -= amount;
        }
    }
    private addNonce(from: string) {
        this.nonces[from] = (this.nonces[from] || 0) + 1;
    }
   

    getGenesisBlock(): BlockType {
        return this.chain[0];
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

    getFullChain(): BlockType[] {
        return this.chain;
    }

    getNonce (from: string): number {
        return this.nonces[from] || 0;
    }
}

export default Blockchain