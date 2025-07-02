import * as fs from 'fs';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

console.log('Simple Blockchain Implementation in TypeScript');
type TransactionType = {
    from: string;
    to: string;
    amount: number;
    nonce: number;
}
type BlockType = {
    index: number;
    prevHash: string;
    hash: string;
    timestamp: number;
    merkleRoot: string;
    transactions: TransactionType[];
    nonce: number;
}
const TX_PER_BLOCK = 5; // Maximum transactions per block
const Block = {  }
const BlockChain : BlockType[]= [];
const MemPool: TransactionType[] = [];
const Balances: { [key: string]: number } = {};
const Nonces: { [key: string]: number } = {};

const createBlock = (index: number, prevHash: string, hash: string,timestamp: number, merkleRoot: string,transactions: TransactionType[], nonce: number): BlockType => {
    return {
        index,
        prevHash,
        timestamp,
        hash,
        merkleRoot,
        transactions,
        nonce
    };
};
const addTransaction = (from: string, to: string, amount: number): TransactionType => {
    const transaction: TransactionType = { from, to, amount, nonce: Nonces[from] || 0 };
    if(getBalance(from) >= amount ) {
        MemPool.push(transaction);
        console.log(`Transaction added: ${JSON.stringify(transaction)}`);
        console.log(MemPool.length)
        if( MemPool.length >= TX_PER_BLOCK) {
            console.log(`Mining block with ${MemPool.length} transactions...`);
            mineBlock(MemPool);
            MemPool.length = 0; // Clear the mempool after mining
        }
        
    } else {
        console.log(`${from} Insufficient Balance  : ${amount}`)
    }
    return transaction;
}
const mineBlock = (transactions : TransactionType[]): void => {
    const length = BlockChain.length;
    const prevBlock = BlockChain[length - 1];
    const prevHash = prevBlock ? prevBlock.hash : '0';
    const timestamp = Date.now();
    const createBlockData: TransactionType[] = transactions.slice(0, TX_PER_BLOCK); // Take only the first TX_PER_BLOCK transactions
    const validTransactions = []
    for (const tx of createBlockData) {
        if(tx.nonce === (Nonces[tx.from] || 0)) {
            validTransactions.push(tx);
            transferBalance( tx.from, tx.to, tx.amount)
            Nonces[tx.from] = (Nonces[tx.from] || 0 ) + 1;
        } else {
            console.error(`Invalid Transaction: ${JSON.stringify(tx)}`);
        }
    }
    const { nonce, hash } = findNonce(length, prevHash, timestamp, validTransactions) // Simple nonce for demonstration
    const merkleTree = new MerkleTree(validTransactions.map(tx => makeHash(JSON.stringify(tx))), makeHash, { sortPairs: true });
    const merkleRoot = merkleTree.getRoot().toString('hex');
    const newBlock = createBlock(length, prevHash, hash, timestamp, merkleRoot, validTransactions, nonce);
    BlockChain.push(newBlock);
}

const calculateHash = (index: number, prevHash: string, timestamp: number, transactions: TransactionType[], nonce: number): string => {
    const formattedData = JSON.stringify(transactions);
    return makeHash(`${index}${prevHash}${timestamp}${formattedData}${nonce}`);
}

const makeHash = (data: string): string => {
    // return crypto.createHash('sha256').update(data).digest('hex');
    return keccak256(data).toString('hex');
}

const addBalance = (from: string, amount: number) => {
    Balances[from] = (Balances[from] + 0) ||  amount;
}

const getBalance = (from: string) => {
    return Balances[from] || 0;
}

const transferBalance = (from: string, to : string, amount : number) => {
    Balances[from] -= amount;
    Balances[to] = (Balances[to] || 0) + amount;
}

const findNonce = (index: number, prevHash: string, timestamp : number, transactions: TransactionType[], difficulty: number = 2, maxAttempt: number = 10000): {nonce : number, hash: string} => {
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
addBalance('Alice',100)
addBalance('Charlie', 30)
addBalance('Ivan', 70)
addBalance('Bob', 70)
addBalance('Eve', 100)
addBalance('Alice', 100)
addBalance('David', 100)
addBalance('Jhon', 100)
addBalance('Frank', 100)
addBalance('Grace', 100)
addBalance('Judy', 100)
console.log(getBalance('Alice'), "Alice")
console.log(getBalance('Charlie'), "Charlie")
console.log(getBalance('Bob'), "Bob")
addTransaction('Jhon', 'Bob', 50);
addTransaction('Bob', 'Charlie', 30);
addTransaction('Charlie', 'Alice', 20);
addTransaction('Alice', 'David', 10);
addTransaction('David', 'Eve', 5);
addTransaction('Eve', 'Frank', 15);
addTransaction('Frank', 'Grace', 25);
addTransaction('Grace', 'Heidi', 35);
addTransaction('Heidi', 'Ivan', 45);
addTransaction('Ivan', 'Judy', 55);
addTransaction('Judy', 'Alice', 65);
console.log(BlockChain);
fs.writeFileSync('chain.json', JSON.stringify(BlockChain, null, 2));


/**
 * Example output of BlockChain:

 * 
 */
