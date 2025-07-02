import elliptic from 'elliptic';
const EC = elliptic.ec;
const ec = new EC('secp256k1'); // same as Bitcoin/Ethereum

// // Generate a new keypair
const key = ec.genKeyPair();
const publicKey = key.getPublic('hex');
const privateKey = key.getPrivate('hex');

console.log('Public Key:', publicKey);
console.log('Private Key:', privateKey);

// Public Key: 0499e72b4ab18ec37638754657528ec87f9257ee847fbc387500602cd70deed97e7748eedefaad5f9feb5218022bdc8138380e4798ddedadbe6d7af4e396119495
// Private Key: 9a07010ce1285cfa7364c8f272634afe59db82db532f5ca286760b3d2e542258
