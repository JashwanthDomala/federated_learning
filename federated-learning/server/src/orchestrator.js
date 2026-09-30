const { decodeWeights } = require('./protoHelper');
const { federatedAveraging } = require('./fedAvg');

const QUORUM_TARGET = 2;
let currentRound = 1;
let roundActive = true;
let clientWeightsBuffer = [];
let globalModel = [0.0, 0.0]; 

function handleConnection(io, socket) {
    console.log(`Client connected: ${socket.id}`);

    // Send the current model to new connections
    if (roundActive) {
        socket.emit('start_round', { roundNumber: currentRound, weights: globalModel });
    }

    socket.on('upload_weights', (binaryPayload) => {
        // STRICT LOCK: If the timer is ticking, ignore all incoming data
        if (!roundActive) return;

        const decodedData = decodeWeights(binaryPayload);
        clientWeightsBuffer.push(decodedData);
        console.log(`Received weights from ${socket.id}. (${clientWeightsBuffer.length}/${QUORUM_TARGET})`);

        if (clientWeightsBuffer.length >= QUORUM_TARGET) {
            roundActive = false; // Lock the system immediately
            console.log(`\nQuorum reached! Aggregating Round ${currentRound}...`);

            globalModel = federatedAveraging(clientWeightsBuffer);
            currentRound++;
            clientWeightsBuffer = [];
            
            console.log(`Waiting 3 seconds before starting Round ${currentRound}...\n`);
            
            // Wait 3 full seconds, then unlock and broadcast
            setTimeout(() => {
                roundActive = true; // Unlock
                io.emit('start_round', { roundNumber: currentRound, weights: globalModel });
            }, 3000);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client dropped: ${socket.id}`);
    });
}

module.exports = { handleConnection };