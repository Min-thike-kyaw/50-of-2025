# Full Stack NFT Marketplace

This project is a full-stack NFT marketplace, featuring:
- Smart contracts for NFT listing, buying, and selling
- A subgraph for efficient event indexing and querying
- A modern Next.js frontend
- Local development with Docker for Graph Node, IPFS, and Postgres

## Project Structure

- `NftMarketplace/` – Hardhat project for smart contracts
- `nft-marketplace-subgraph/` – The Graph subgraph for marketplace events
- `docker/` – Docker setup for local Graph Node, IPFS, and Postgres
- `nextjs-nft-marketplace/` – Next.js frontend

---

## Quick Start

### 1. Compile and Deploy Contracts

```bash
cd NftMarketplace
# Install dependencies
yarn install
# Start a local Hardhat node
yarn hardhat node
# In a new terminal, deploy contracts to localhost
# (update scripts as needed for your deployment)
yarn hardhat deploy --network localhost
```

### 2. Start Docker Services (Graph Node, IPFS, Postgres)

```bash
cd docker
# Build Docker images (especially for Apple Silicon/M1)
./build.sh
# Start all services
docker compose up
```

- Graph Node endpoints:
  - GraphiQL: http://localhost:8000/
  - Admin: http://localhost:8020/
- IPFS: http://localhost:5001/
- Postgres: postgresql://graph-node:let-me-in@localhost:5432/graph-node

### 3. Build and Deploy the Subgraph

```bash
cd ../nft-marketplace-subgraph
# Install dependencies
yarn install
# Generate types
yarn codegen
# Build the subgraph
yarn build
# Create the subgraph on the local node
yarn create-local
# Deploy to the local node
yarn deploy-local
```

### 4. Run the Frontend

```bash
cd ../nextjs-nft-marketplace
# Install dependencies
yarn install
# Start the development server
yarn dev
```

Visit http://localhost:3000 to use the NFT marketplace UI.

---

## Contracts Overview

- **NftMarketplace.sol**: Main contract for listing, buying, and selling NFTs. Handles listing management, purchase logic, and proceeds withdrawal.
- **BasicNft.sol**: Simple ERC721 contract for testing and demo purposes.

## Subgraph Overview

The subgraph indexes marketplace events:
- `ItemListed`, `ItemBought`, `ItemCancelled`, and `ActiveItem`

This enables fast, flexible queries for marketplace activity.

## Docker Overview

Docker is used to run local instances of:
- **Graph Node** (The Graph protocol)
- **IPFS** (decentralized file storage)
- **Postgres** (database for Graph Node)

See `docker/README.md` for more details and troubleshooting.

---

## Requirements
- Node.js (v18+ recommended)
- Yarn
- Docker

---

## Troubleshooting
- If using Apple Silicon (M1/M2), see Docker build notes in `docker/README.md`.
- Ensure all services are running before deploying the subgraph or using the frontend.

---

## License
MIT
