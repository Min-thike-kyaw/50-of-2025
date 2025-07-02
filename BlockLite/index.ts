import * as crypto from 'crypto';

type Transaction = {
    from: string;
    to: string;
    amount: number;
}
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
    const {nonce, hash} = findNonce(length, prevHash, timestamp, data) // Simple nonce for demonstration

    const newBlock = createBlock(length, prevHash, hash, timestamp,data, nonce);
    BlockChain.push(newBlock);
}

const calculateHash = (index: number, prevHash: string, timestamp: number, data: string, nonce: number): string => {
    return crypto.createHash('sha256').update(`${index}${prevHash}${timestamp}${data}${nonce}`).digest('hex');
}

const findNonce = (index: number, prevHash: string, timestamp : number, data: string, difficulty: number = 2, maxAttempt: number = 10000): {nonce : number, hash: string} => {
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

addBlock('First block data');
addBlock('Second block data');
addBlock('Third block data');
console.log(BlockChain);

/**
 * Example output of BlockChain:
[
  {
    index: 0,
    prevHash: '0',
    timestamp: 1751436061819,
    hash: '000472db6f3f36e16339ac4b7b4077a1151c8dad3cb04b8d7727dc7d0065f6a5',
    data: 'First block data',
    nonce: 51
  },
  {
    index: 1,
    prevHash: '000472db6f3f36e16339ac4b7b4077a1151c8dad3cb04b8d7727dc7d0065f6a5',
    timestamp: 1751436061819,
    hash: '00310c17f849750d5ce9f710dce47e97a2137878a0aa405581f738d80d080139',
    data: 'Second block data',
    nonce: 135
  },
  {
    index: 2,
    prevHash: '00310c17f849750d5ce9f710dce47e97a2137878a0aa405581f738d80d080139',
    timestamp: 1751436061820,
    hash: '006f66a956ba371c4c6721de7fa86a25e39b05d24074d3d552fb3a0d1c7494a1',
    data: 'Third block data',
    nonce: 470
  }
]
 * 
 */
