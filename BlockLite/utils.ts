import { TransactionType } from "./type";
import keccak256 from 'keccak256';
import { MerkleTree } from 'merkletreejs';

export const calculateHash = (index: number, prevHash: string, timestamp: number, transactions: TransactionType[], nonce: number): string => {
    const formattedData = serializeTransactions(transactions);
    return makeHash(`${index}${prevHash}${timestamp}${formattedData}${nonce}`);
}

export const makeHash = (data: string): string => {
    return keccak256(data).toString('hex');
}

export const serializeTransaction = (tx: TransactionType): string => {
    return JSON.stringify(tx);
}

export const serializeTransactions = (txs: TransactionType[]): string => {
    return JSON.stringify(txs)
}

// Utility function (add to utils.ts)
export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const calculateMerkleRoot = (transactions : TransactionType[]): string => {
    const leaves = transactions.map(tx => makeHash(serializeTransaction(tx)))
    const merkleTree = new MerkleTree(leaves, makeHash, { sortPairs: true });
    return merkleTree.getRoot().toString('hex');
}
