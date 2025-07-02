import * as crypto from 'crypto';

type BlockType = {
    index: number;
    prevHash: string;
    hash: string;
    timestamp: number;
    data: string;
    nonce: number;
}
const Block = {  }
const BlockChain : BlockType[]= []
const createBlock = (index: number, prevHash: string, hash: string,timestamp: number, data: string, nonce: number): BlockType => {
    return {
        index,
        prevHash,
        timestamp: Date.now(),
        hash,
        data,
        nonce
    };
};
const addBlock = (data: string): void => {
    const length = BlockChain.length;
    const prevBlock = BlockChain[length - 1];
    const prevHash = prevBlock ? prevBlock.hash : '0';
    const timestamp = Date.now();
    const {nonce, hash} = findNonce(length, prevBlock.hash, timestamp, data) // Simple nonce for demonstration

    const newBlock = createBlock(length, prevHash, hash, timestamp,data, nonce);
    BlockChain.push(newBlock);
}

const calculateHash = (index: number, prevHash: string, timestamp: number, data: string, nonce: number): string => {
    return crypto.createHash('sha256').update(`${index}${prevHash}${timestamp}${data}${nonce}`).digest('hex');
}

const findNonce = (index: number, prevHash: string, timestamp : number, data: string, difficulty: number = 2, maxAttempt: number = 100): {nonce : number, hash: string} => {
    let nonce = 0;
    const prefix = '0'.repeat(difficulty);
    while (maxAttempt--) {
        const hash = calculateHash(index, prevHash, timestamp, data, nonce);
        if (hash.startsWith(prefix)) {
            return { nonce, hash };
        }
        nonce++;
    }
    throw new Error('Nonce not found within max attempts');
}
