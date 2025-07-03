import * as fs from 'fs';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import elliptic from 'elliptic';

console.log('Simple Blockchain Implementation in TypeScript');
type TransactionType = {
    from: string;
    to: string;
    amount: number;
    nonce: number;
    signature?: string; // Optional signature for transaction validation
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

const ACCOUNTS = {
    "0499e72b4ab18ec37638754657528ec87f9257ee847fbc387500602cd70deed97e7748eedefaad5f9feb5218022bdc8138380e4798ddedadbe6d7af4e396119495": "9a07010ce1285cfa7364c8f272634afe59db82db532f5ca286760b3d2e542258",
    "0408e4d7049df8d142d396775afb3f7c0140edd07087e9bcfe574e356867e876dbc167ffc943dd880bb94dd0da172bbdbc77264fe2048aece2350987dd9fdde34e": "37fbdc8971c7bc8d2277b07c275f0ac3545527909dac050837be56083908e7bf",
    "041f958fe31edda3dc055fe3027ee0e5e04cda51ebb680e848b7ebdd77d1d76c55834410f4ba2a58a555f4cad9abc11bf5b5502293c0c0dc1ea3208b6ac2091cc2": "b536e2a1b33c647728d4d7b71429c5555039412e784ebdbf62a17615ce44636a"
}
const TX_PER_BLOCK = 2; // Maximum transactions per block
const Block = {  }
const BlockChain : BlockType[]= [];
const MemPool: TransactionType[] = [];
const Balances: { [key: string]: number } = {};
const Nonces: { [key: string]: number } = {};
const EC = elliptic.ec;
const ec = new EC('secp256k1'); // same as Bitcoin/Ethereum

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
const addTransaction = (trx: TransactionType): TransactionType => {
    if(!verifySignature(trx)) {
        console.log(`Invalid transaction signature for transaction: ${JSON.stringify(trx)}`);
        return trx;
    }

    if(getBalance(trx.from) >= trx.amount ) {
        MemPool.push(trx);
        console.log(`Transaction added: ${JSON.stringify(trx)}`);
        console.log(MemPool.length)
        if( MemPool.length >= TX_PER_BLOCK) {
            console.log(`Mining block with ${MemPool.length} transactions...`);
            mineBlock(MemPool);
            MemPool.length = 0; // Clear the mempool after mining
        }
        
    } else {
        console.log(`${trx.from} Insufficient Balance  : ${trx.amount}`)
    }
    return trx;
}

const verifySignature = (transaction: TransactionType): boolean => {
    if (!transaction.signature) {
        console.error('Transaction signature is missing');
        return false;
    }
    const key = ec.keyFromPublic(transaction.from, 'hex');
    const txData = { ...transaction };
    delete txData.signature; // Remove signature for verification
    const txHash = makeHash(JSON.stringify(txData));
    return key.verify(txHash, transaction.signature);
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
    if (getBalance(from) < amount) throw new Error("Insufficient balance");
    Balances[from] -= amount;
    Balances[to] = (Balances[to] || 0) + amount;
}

const getNonce = (from: string): number => {
    return Nonces[from] || 0;
}

const getPrivate = (from: string): string => {
    return ACCOUNTS[from] || '';
}

const signTransaction = (transaction: TransactionType, privateKey: string): TransactionType => {
    const key = ec.keyFromPrivate(privateKey, 'hex');
    const txHash = makeHash(JSON.stringify(transaction));
    const signature = key.sign(txHash).toDER('hex');
    return {...transaction, signature};
}


// Sign and Add Transactions
const signAndAddTransaction = (from: string, to: string, amount: number): TransactionType => {
    const nonce = getNonce(from);
    const PRIVATE_KEY = getPrivate(from);
    if (!PRIVATE_KEY) {
        throw new Error(`Private key not found for ${from}`);
    }

    const trx = signTransaction({from, to, amount, nonce}, PRIVATE_KEY);
    return addTransaction(trx);
}

addBalance('0499e72b4ab18ec37638754657528ec87f9257ee847fbc387500602cd70deed97e7748eedefaad5f9feb5218022bdc8138380e4798ddedadbe6d7af4e396119495',100)
addBalance('0408e4d7049df8d142d396775afb3f7c0140edd07087e9bcfe574e356867e876dbc167ffc943dd880bb94dd0da172bbdbc77264fe2048aece2350987dd9fdde34e', 30)
addBalance('041f958fe31edda3dc055fe3027ee0e5e04cda51ebb680e848b7ebdd77d1d76c55834410f4ba2a58a555f4cad9abc11bf5b5502293c0c0dc1ea3208b6ac2091cc2', 70)

console.log(getBalance('Alice'), "Alice")
console.log(getBalance('Charlie'), "Charlie")
console.log(getBalance('Bob'), "Bob")

signAndAddTransaction('0499e72b4ab18ec37638754657528ec87f9257ee847fbc387500602cd70deed97e7748eedefaad5f9feb5218022bdc8138380e4798ddedadbe6d7af4e396119495', '0408e4d7049df8d142d396775afb3f7c0140edd07087e9bcfe574e356867e876dbc167ffc943dd880bb94dd0da172bbdbc77264fe2048aece2350987dd9fdde34e', 10);
signAndAddTransaction('0408e4d7049df8d142d396775afb3f7c0140edd07087e9bcfe574e356867e876dbc167ffc943dd880bb94dd0da172bbdbc77264fe2048aece2350987dd9fdde34e','041f958fe31edda3dc055fe3027ee0e5e04cda51ebb680e848b7ebdd77d1d76c55834410f4ba2a58a555f4cad9abc11bf5b5502293c0c0dc1ea3208b6ac2091cc2', 30 )
console.log(BlockChain);
fs.writeFileSync('chain.json', JSON.stringify(BlockChain, null, 2));


