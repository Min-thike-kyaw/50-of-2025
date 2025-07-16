const configuration = {
    'iceServers': []
}
const localVideo = document.querySelector('video#local');
const remoteVideo = document.querySelector('video#remote');
const remoteVideosContainer = document.getElementById('remoteVideosContainer');

let localPeerId = null;
const knownPeers = new Set(); // Track known peers
const connectedPeers = new Map(); // Track already connected peers
const connectionStates = new Map(); // Track connection states of peers

// Start with streaming
navigator.mediaDevices.getUserMedia({
    video : true,
    audio: true
}).then((stream) => {
    localVideo.srcObject = stream;
});



/**
 * 
 * Constant
 * 
 */
const SIGNALING_SERVER_URL = 'ws://localhost:3001';
const MESSAGE_TYPE = {
    OFFER: 'offer',
    ANSWER: 'answer',
    CANDIDATE: 'candidate',
    YOUR_ID: 'your-id',
    PEER_LIST: 'peer-list',
}
/**
 * 
 * Configuration for WebRTC Peer Connection
 * 
 */
const ws = new WebSocket(SIGNALING_SERVER_URL);
// let pc = new RTCPeerConnection(configuration);
// const dataChannel = pc.createDataChannel("chat");

/** Web Socket */

ws.addEventListener('message', async (event) => {
    // console.log(JSON.parse(event.data))
    // const textMessage = await event.data.text();
    // const message = await JSON.parse(textMessage);
    const data = event.data instanceof Blob ? await event.data.text() : event.data;
    console.log("Received message from server:", event.data);
    const message = JSON.parse(data)

    if (message.type === MESSAGE_TYPE.YOUR_ID) {
        console.log("Your ID:", message.data);
        localPeerId = message.data;
    }else if (message.type === MESSAGE_TYPE.PEER_LIST) {
        updatePeerList(message.data);
    } else if (message.type === MESSAGE_TYPE.OFFER) {
        console.log("Received offer:", message.data);
        // await acceptAndAnswer(message.data)
        await handleOffer(message.sender,message.data)
    } else if (message.type === MESSAGE_TYPE.ANSWER) {
        console.log("Received answer:", message.data);
        await handleAnswer(message.sender, message.data);
    } else if (message.type === MESSAGE_TYPE.CANDIDATE) {
        await handleCandidate(message.sender, message.data);
        // await addIceCandidate(message.data);
    }
})

const send = (peerId,data, type) => {
    console.log("Sending message to server:", data, type);
    const message = JSON.stringify({
        data,type,target: peerId, sender: localPeerId
    })
    ws.send(message)
}

/** Data Channel */

/** P2P */
const setPcEventListener = (peerId,pc) => {
    pc.ondatachannel = (event) => {
        const receivedChannel = event.channel;
        receivedChannel.onopen = () => {
            sendMessage("Hello Peer!");
            console.log("DataChannel is open on PC2!");
        };
        receivedChannel.onmessage = (event) => {
            console.log("Received:", event.data);
        };
    };
    
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            console.log("New Ice Candidate ",event.candidate)
            send(event.candidate, MESSAGE_TYPE.CANDIDATE);
        }
    };
    
    pc.oniceconnectionstatechange = () => {
        console.log("ICE Connection State:", pc.iceConnectionState);
    };
    
    pc.onconnectionstatechange = () => {
        console.log("PeerConnection State:", pc.connectionState);
    };
    
    pc.ontrack = (event) => {
        console.log("Track received:", event.track);
        if (event.streams && event.streams.length > 0) {
            remoteVideo.srcObject = event.streams[0];
            console.log("Remote video stream set:", event.streams[0]);
        } else {
            console.warn("No streams found in the received track.");
        }
    }
}


const createOffer = async (peerId,pc) => {
    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log("Offer created:");
        send(peerId,offer, MESSAGE_TYPE.OFFER);
        return offer;
    } catch (error) {
        console.error("Error creating offer:", error);
    }
}

const setRemoteDescription = async (offer) => {
    try {
        await pc.setRemoteDescription(offer);
        console.log("Remote description set:", offer);
    } catch (error) {
        console.error("Error setting remote description:", error);
    }
}
async function handleAnswer(senderId, answer) {
    const peer = connectedPeers.get(senderId);
    if (!peer) return;
    
    try {
      await peer.pc.setRemoteDescription(answer);
    } catch (error) {
      console.error('Error handling answer:', error);
      cleanupPeer(senderId);
    }
  }

  function cleanupPeer(peerId) {
    const peer = connectedPeers.get(peerId);
    if (peer) {
      peer.pc.close();
      peer.videoElement.remove();
    }
    connectedPeers.delete(peerId);
  }

  async function handleCandidate(senderId, candidate) {
    const peer = connectedPeers.get(senderId);
    if (!peer) return;
    
    try {
      await peer.pc.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }
const createAnswer = async () => {
    try {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("Answer created:", answer);
        console.log(JSON.stringify(answer));
        return answer;
    } catch (error) {
        console.error("Error creating answer:", error);
    }
}

const addIceCandidate = async (candidate) => {
    try {
        console.log(`Adding ICE candidate:`, candidate);
        await pc.addIceCandidate(candidate);
    } catch (error) {
        console.error("Error adding ICE candidate:", error);
    }
}

function renderPeerList() {
    const peerListElement = document.getElementById('peer-list');
    if (!peerListElement) return;
    
    peerListElement.innerHTML = '';
    
    knownPeers.forEach(peerId => {
      const li = document.createElement('li');
      li.className = 'peer-item';
      
      // Peer info
    //   const meta = peerMetadata.get(peerId);
    //   const peerName = meta?.name || peerId;
      li.textContent = peerId;
      
      // Connection status
      const status = document.createElement('span');
      status.className = connectedPeers.has(peerId) ? 
        'status-connected' : 'status-disconnected';
      status.textContent = connectedPeers.has(peerId) ? '✓' : '✗';
      li.appendChild(status);
      
      // Action buttons
      if (!connectedPeers.has(peerId)) {
        const connectBtn = document.createElement('button');
        connectBtn.textContent = 'Connect';
        connectBtn.onclick = () => initiateConnection(peerId);
        li.appendChild(connectBtn);
      } else {
        const disconnectBtn = document.createElement('button');
        disconnectBtn.textContent = 'Disconnect';
        disconnectBtn.onclick = () => cleanupPeer(peerId);
        li.appendChild(disconnectBtn);
      }
      
      peerListElement.appendChild(li);
    });
  }
  
// const acceptAndAnswer = async (answer) => {
//     // 1. Set Remote Description
//     await pc.setRemoteDescription(answer);
    
//     // 2. Get local media
//     const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//     stream.getTracks().forEach(track => pc.addTrack(track, stream));
//     localVideo.srcObject = stream

//     // 3. Create and send answer
//     const result = await createAnswer();
//     send(result, MESSAGE_TYPE.ANSWER);
// }

const handleOffer = async (senderId, offer) => {
    if (connectedPeers.has(senderId)) {
      console.warn(`Already connected to ${senderId}`);
      return;
    }
    
    const pc = await createPeerConnection(senderId);
    
    try {
      await pc.setRemoteDescription(offer);
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      send(senderId, answer, MESSAGE_TYPE.ANSWER);
    } catch (error) {
      console.error('Error handling offer:', error);
      cleanupPeer(senderId);
    }
  }



/** Media */

const call = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video : true,
            audio: true
        });
        
        localVideo.srcObject = stream;

        stream.getTracks().forEach(track => {
            console.log("Adding track to PeerConnection:", track);
            pc.addTrack(track, stream);
        })
        createOffer();
    } catch (error) {
        if(error.name === 'NotAllowedError') {
            console.error("Permission to access media devices was denied.");
        }
        console.error("Error accessing media devices:", error);
    }
}


/** Utilities */
const updatePeerList = (peerList) => {
    // Filter out ourselves and already connected peers
    const newPeers = peerList.filter(peer => 
        peer !== localPeerId && !connectedPeers.has(peer)
    );

    // Update known peers
    knownPeers.clear();
    newPeers.forEach(peer => knownPeers.add(peer));

    console.log(newPeers, "New Peers");
    // Render UI
    const peerListElement = document.getElementById('peer-list');
    peerListElement.innerHTML = '';
    
    knownPeers.forEach(peerId => {
        const li = document.createElement('li');
        li.textContent = peerId;
        
        const connectBtn = document.createElement('button');
        connectBtn.textContent = 'Connect';
        connectBtn.onclick = () => initiateConnection(peerId);
        
        li.appendChild(connectBtn);
        peerListElement.appendChild(li);
    });

}
const initiateConnection = async (peerId) => {
    if(connectedPeers.has(peerId)) {
        console.warn(`Already connected to ${peerId}`);
        return;
    }
    console.log(`Initiating connection to ${peerId}`);
    // connectedPeers.add(peerId);

    const pc = await createPeerConnection(peerId);
    
    createOffer(peerId, pc)

}

const createPeerConnection = async (peerId) => {
    const pc = new RTCPeerConnection(configuration);
    const dataChannel = pc.createDataChannel(`chat-${peerId}`);

    connectionStates.set(peerId, {
        pc: pc,
        state: 'connecting',
        connectedAt: null,
        stats: null
    });

    // Add local stream if available
    if (localVideo.srcObject) {
        console.log("Adding local tracks to PeerConnection");
        localVideo.srcObject.getTracks().forEach(track => {
          pc.addTrack(track, localVideo.srcObject);
        });
      }

    // Create video element
    const videoElement = document.createElement('video');
    videoElement.id = `remoteVideo-${peerId}`;
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    remoteVideosContainer.appendChild(videoElement);

    // Store connection
    connectedPeers.set(peerId, { pc, dataChannel, videoElement });
    console.log(connectedPeers)

    pc.ontrack = (event) => {
        const peer = connectedPeers.get(peerId);
        if (peer && event.streams[0]) {
          peer.videoElement.srcObject = event.streams[0];
        }
    };

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            console.log("New Ice Candidate ",event.candidate)
            send(peerId,event.candidate, MESSAGE_TYPE.CANDIDATE);
        }
    };

    pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log(`Connection state for ${peerId}:`, state);
        connectionStates.get(peerId).state = state;

        if (state === 'connected') {
            connectionStates.get(peerId).connectedAt = new Date();
            console.log(`Connected to ${peerId} at ${connectionStates.get(peerId).connectedAt} ${state}`);
            renderPeerList();
        } else if (state === 'disconnected' || state === 'failed') {
            console.warn(`Disconnected from ${peerId}`);
            // connectionStates.delete(peerId);
        }
    }
    return pc;
}