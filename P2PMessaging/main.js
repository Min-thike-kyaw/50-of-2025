const configuration = {'iceServers': []}

let pc = new RTCPeerConnection(configuration);

const dataChannel = pc.createDataChannel("chat");

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
        console.log(JSON.stringify(event.candidate));
    }
};

pc.oniceconnectionstatechange = () => {
    console.log("ICE Connection State:", pc.iceConnectionState);
};

pc.onconnectionstatechange = () => {
    console.log("PeerConnection State:", pc.connectionState);
};

const createOffer = async () => {
    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log("Offer created:");
        console.log(JSON.stringify(offer))
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
    } catch (error) {
        console.error("Error creating answer:", error);
    }
}

const addIceCandidate = async (candidate) => {
    try {
        await pc.addIceCandidate(candidate);
        console.log("ICE candidate added:", candidate);
    } catch (error) {
        console.error("Error adding ICE candidate:", error);
    }
}

const acceptAndAnswer = async (answer) => {
    await pc.setRemoteDescription(answer);
    await createAnswer();
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
  

console.log("pc created:", pc);
console.log("Hello, World!");