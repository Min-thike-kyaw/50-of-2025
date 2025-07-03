import elliptic from 'elliptic';
import { TransactionType } from './type';
import { makeHash, serializeTransaction } from './utils';
import Blockchain from './Blockchain';
const EC = elliptic.ec;
const ec = new EC('secp256k1'); 

class Wallet {
    private keyPair: elliptic.ec.KeyPair;
    private publicKey: string;
    constructor(privateKey ?:string,) {
        this.keyPair = privateKey ? ec.keyFromPrivate(privateKey) : ec.genKeyPair();
        this.publicKey = ec.keyFromPrivate(this.keyPair).getPublic('hex');
    }

    private signTransaction (transaction: TransactionType): TransactionType  {
        const txHash = makeHash(serializeTransaction(transaction));
        const signature = this.keyPair.sign(txHash).toDER('hex');
        return {...transaction, signature};
    }

    sendTransaction (to: string, amount: number, blockchain: Blockchain): TransactionType {
        const nonce = blockchain.getNonce(this.getAddress());

        const trx = this.signTransaction({from: this.getAddress(), to, amount, nonce});
        return blockchain.createTransaction(trx);
    }

    getAddress (): string {
        return this.publicKey;
    }
}

export default Wallet;