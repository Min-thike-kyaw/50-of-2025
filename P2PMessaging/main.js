const configuration = {
    'iceServers': []
}
const localVideo = document.querySelector('video#local');
const remoteVideo = document.querySelector('video#remote');

/**
 * 
 * Constant
 * 
 */
const SIGNALING_SERVER_URL = 'ws://localhost:3001';
const MESSAGE_TYPE = {
    OFFER: 'offer',
    ANSWER: 'answer',
    CANDIDATE: 'candidate'
    }
/**
 * 
 * Configuration for WebRTC Peer Connection
 * 
 */
const ws = new WebSocket(SIGNALING_SERVER_URL);
let pc = new RTCPeerConnection(configuration);
const dataChannel = pc.createDataChannel("chat");

/** Web Socket */

ws.addEventListener('message', async (event) => {
    const textMessage = await event.data.text();
    const message = await JSON.parse(textMessage);
    console.log("Received message from server:", message);

    if (message.type === MESSAGE_TYPE.OFFER) {
        console.log("Received offer:", message.data);
        await acceptAndAnswer(message.data)
    } else if (message.type === MESSAGE_TYPE.ANSWER) {
        console.log("Received answer:", message.data);
        await setRemoteDescription(message.data);
    } else if (message.type === MESSAGE_TYPE.CANDIDATE) {
        await addIceCandidate(message.data);
    }
})

const send = (data, type) => {
    console.log("Sending message to server:", data, type);
    const message = JSON.stringify({
        data,type
    })
    ws.send(message)
}

/** Data Channel */

/** P2P */
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

const createOffer = async () => {
    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log("Offer created:");
        send(offer, MESSAGE_TYPE.OFFER);
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

const acceptAndAnswer = async (answer) => {
    // 1. Set Remote Description
    await pc.setRemoteDescription(answer);
    
    // 2. Get local media
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    localVideo.srcObject = stream

    // 3. Create and send answer
    const result = await createAnswer();
    send(result, MESSAGE_TYPE.ANSWER);
}

const sendMessage = (message) => {
    console.log(`Data channel state: ${dataChannel.readyState}`)
    if (dataChannel.readyState === "open") {
        dataChannel.send(message);
        console.log("Message sent:", message);
    } else {
        console.error("Data channel is not open. Cannot send message.");
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