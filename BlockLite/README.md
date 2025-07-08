# Custom Blockchain Implementation

A simple yet functional blockchain prototype built from scratch to understand and demonstrate core blockchain concepts like blocks, transactions, wallets, mining, and consensus.

## Features

- **Block structure:** Supports linked blocks with cryptographic hashes and Merkle roots.
- **Transactions:** Manage balances, nonces, and validate transaction authenticity via digital signatures.
- **Wallet:** Generate public/private key pairs to sign transactions.
- **Mining:** Proof-of-Work consensus with adjustable difficulty.
- **Chain validation:** Ensures integrity and prevents tampering.
- **Basic mempool:** Holds unconfirmed transactions before mining.
- **Peer-to-Peer Networking:** Nodes discover peers, propagate blocks and transactions, and synchronize blockchain state over a decentralized network.


## Getting Started

### Prerequisites

- Node.js (v18 or above)
- npm or yarn

### Installation

```bash
npx tsx generate-wallet.ts
PEER_PORT=6001 npx tsx index.ts
