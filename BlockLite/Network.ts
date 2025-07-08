import Blockchain from "./Blockchain";
import WebSocket, { WebSocketServer } from 'ws';
import MessageType from "./constants/MessageType";
import { BlockType, TransactionType } from "./type";


const PORT = process.env.PEER_PORT || 6001;
class Network {
    private blockchain: Blockchain;
    private sockets: WebSocket[] = [];
    private peers: string[];
    private server : WebSocketServer;
    
    constructor(blockchain: Blockchain) {
        this.blockchain = blockchain;
        this.server = new WebSocketServer({ port: Number(PORT) });
        this.peers = [];
        // Private constructor to prevent instantiation
    }

    addConnection(peer: string): void {
        if (!this.peers.includes(peer)) {
            this.peers.push(peer); 
        }
    }

    init(): void {
        this.server.on('connection', (ws: WebSocket) => this.initConnection(ws));
        this.connectToPeers(this.peers);
        console.log(`P2P server listening on port ${PORT}`);
    }

    connectToPeers(peers: string[]): void {
        peers.forEach((peer: string) => {
            const ws = new WebSocket(peer);
            ws.on('open', () => this.initConnection(ws));
            ws.on('error', () => console.log(`Failed to connect to peer ${peer}`));
        });
        
    }

    initConnection(ws: WebSocket)  {
        if (!this.sockets.includes(ws)) {
            this.sockets.push(ws);
        }        
        console.log('New peer connected');
        this.send(ws, this.queryLatest()); // ← Immediately request latest block

        ws.on('message', (data) => this.handleMessage(ws, data.toString()));
        ws.on('close', () => this.removeSocket(ws));
    }

    private handleMessage(ws: WebSocket, data: string): void {
        const message = JSON.parse(data);
        switch (message.type) {
            case MessageType.QUERY_LATEST:
                this.send(ws, this.responseLatest());
                break;
            case MessageType.QUERY_ALL:
                this.send(ws, this.responseAll());
                break;
            case MessageType.RESPONSE_BLOCKCHAIN:
                this.handleBlockchainResponse(message.data);
                break;
            case MessageType.NEW_TRANSACTION:
                if(this.blockchain.createTransaction(message.data)){
                    this.broadcastTransaction(message.data);
                }
                break;
            case MessageType.NEW_BLOCK:
                if(this.blockchain.addBlock(message.data)) {
                    console.log('New block added:', message.data);
                    // this.broadBlock(message.data);
                }
                break;
            default:
                console.error('Unknown message type:', message.type);
        }
    }

    private removeSocket(ws: WebSocket): void {
        this.sockets = this.sockets.filter((s) => s !== ws);
    }

    private send(ws: WebSocket, message: object): void {
        ws.send(JSON.stringify(message));
    }

    private queryAll() {
        return { type: MessageType.QUERY_ALL };
    }

    private broadcast(message: object) {
        this.sockets.forEach((ws) => {
            this.send(ws, message);
        });
    } 

    broadcastTransaction(data: TransactionType) {
        this.broadcast({
            type: MessageType.NEW_TRANSACTION,
            data
        })
    }

    broadBlock(data: BlockType) {
        this.broadcast({
            type: MessageType.NEW_BLOCK,
            data
        })
    }

    queryLatest() {
        return { type: MessageType.QUERY_LATEST };
      }
    
    responseLatest() {
        return {
            type: MessageType.RESPONSE_BLOCKCHAIN,
            data: [this.blockchain.getLatestBlock()],
        };
    }

    responseAll() {
        return {
            type: MessageType.RESPONSE_BLOCKCHAIN,
            data: this.blockchain.getFullChain(),
        };
    }

    handleBlockchainResponse(receivedBlocks: BlockType[]) {
        const latestReceived = receivedBlocks[receivedBlocks.length - 1];
        const latestHeld = this.blockchain.getLatestBlock();
    
        if (latestReceived.index > latestHeld.index) {
          console.log('Received blockchain is newer');
          if (receivedBlocks.length === 1) {
            this.broadcast(this.queryAll());
          } else {
            this.blockchain.replaceChain(receivedBlocks);
          }
        }
      }
}
export default Network;