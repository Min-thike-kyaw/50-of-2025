const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}

let peerConnection;
const makeSignalingChannel = (clientId) => {
    let peerConnection = new RTCPeerConnection(configuration);
}

console.log("PeerConnection created:", peerConnection);
console.log("Hello, World!");