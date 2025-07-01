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
const createBlock = (index: number, prevHash: string, hash: string, data: string, nonce: number): BlockType => {
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
    const nonce = Math.floor(Math.random() * 1000000); // Simple nonce for demonstration
    const hash = calculateHash(length, prevBlock.hash, Date.now(), data, nonce);
    const newBlock = createBlock(length, prevHash, hash, data, nonce);
    BlockChain.push(newBlock);
}

const calculateHash = (index: number, prevHash: string, timestamp: number, data: string, nonce: number): string => {
    return `${index}${prevHash}${timestamp}${data}${nonce}`; // Simple hash for demonstration
}
