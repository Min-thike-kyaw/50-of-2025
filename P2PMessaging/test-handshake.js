const configurationTest = {
    'iceServers': []
}
const pc1 = new RTCPeerConnection(configurationTest);
const pc2 = new RTCPeerConnection(configurationTest);

// Data channel setup (only on initiator)
const dataChannelTest = pc1.createDataChannel("chat");
dataChannelTest.onopen = () => console.log("PC1: DataChannel open!");


// ICE candidate exchange
pc1.onicecandidate = (event) => {
    if (event.candidate) {
        pc2.addIceCandidate(event.candidate).catch(e => console.error("PC2 addIceCandidate error:", e));
    }
};

pc2.onicecandidate = (event) => {
    if (event.candidate) {
        pc1.addIceCandidate(event.candidate).catch(e => console.error("PC1 addIceCandidate error:", e));
    }
};

// Data channel reception (on PC2)
pc2.ondatachannel = (event) => {
    const receivedChannel = event.channel;
    receivedChannel.onopen = () => console.log("PC2: DataChannel open!");
};

// Debug states
[pc1, pc2].forEach((pc, i) => {
    pc.oniceconnectionstatechange = () => 
        console.log(`PC${i+1} ICE state:`, pc.iceConnectionState);
    pc.onconnectionstatechange = () => 
        console.log(`PC${i+1} Connection state:`, pc.connectionState);
});

// Modified call function
const call = async () => {
    console.log("Starting call...");
    
    // 1. PC1 creates offer
    const offer = await pc1.createOffer();
    await pc1.setLocalDescription(offer);
    
    // 2. PC2 receives offer
    await pc2.setRemoteDescription(offer);
    
    // 3. PC2 creates answer
    const answer = await pc2.createAnswer();
    await pc2.setLocalDescription(answer);
    
    // 4. PC1 receives answer
    await pc1.setRemoteDescription(answer);
    
    console.log("Signaling complete");
};