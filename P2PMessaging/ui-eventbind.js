document.getElementById('offer').onclick = async function() {
    await createOffer();
}
document.getElementById('answer').onclick = async function() {
    const sdpInput = document.getElementById('sdp-input');
    const parsedValue = JSON.parse(sdpInput.value);
    await acceptAndAnswer(parsedValue);
}
document.getElementById('set-remote').onclick = async function() {
    const sdpInput = document.getElementById('sdp-input');
    const parsedValue = JSON.parse(sdpInput.value);
    await setRemoteDescription(parsedValue);
}

document.getElementById('send-message').onclick = function() {
    sendMessage(`${Date.now().toString()} Hey I am sending`);
}
document.getElementById('add-ice-candidate').onclick = async function() {
    const candidateInput = document.getElementById('sdp-input');
    const parsedValue = JSON.parse(candidateInput.value);
    await addIceCandidate(parsedValue);
}
document.getElementById('test-handshake').onclick = async function() {
    await call();
}