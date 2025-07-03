export interface TransactionType {
    from: string;
    to: string;
    amount: number;
    nonce: number;
    signature?: string; // Optional signature for transaction validation
}
export interface BlockType {
    index: number;
    prevHash: string;
    hash: string;
    timestamp: number;
    merkleRoot: string;
    transactions: TransactionType[];
    difficulty: number;
    nonce: number;
}