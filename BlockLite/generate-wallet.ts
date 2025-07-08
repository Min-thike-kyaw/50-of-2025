import elliptic from 'elliptic';
import fs from 'fs'
const EC = elliptic.ec;
const ec = new EC('secp256k1'); // same as Bitcoin/Ethereum

const names = ["Bob", "Alice", "Charlie", "Dave", "Eve"];
const wallets = {};
names.forEach(element => {
    const key = ec.genKeyPair();
    const publicKey = key.getPublic('hex');
    const privateKey = key.getPrivate('hex');
    wallets[element] = {publicKey, privateKey}
});

fs.writeFileSync('wallets.json', JSON.stringify(wallets, null, 2));