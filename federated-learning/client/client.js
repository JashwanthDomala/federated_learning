const { io } = require('socket.io-client');
const protobuf = require('protobufjs');
const path = require('path');
const { trainLocalModel } = require('./tfjs_training');

const root = protobuf.loadSync(path.join(__dirname, '../shared/weights.proto'));
const ClientSubmission = root.lookupType('federated.ClientSubmission');

const socket = io('http://localhost:3000');
const CLIENT_ID = `node_${Math.floor(Math.random() * 1000)}`;

socket.on('connect', () => {
    console.log(`Connected to Orchestrator as Edge Node: ${CLIENT_ID}`);
});

// We only want ONE of these 'start_round' listeners in the file!
socket.on('start_round', async (data) => {
    console.log(`\nReceived Global Model for Round ${data.roundNumber}`);
    
    if (data.weights && data.weights.length >= 2) {
        console.log(`Current Global Weights: Slope=${data.weights[0].toFixed(4)}, Intercept=${data.weights[1].toFixed(4)}`);
    } else {
        console.log(`Current Global Weights: Initializing from scratch...`);
    }
    
    try {
        // Correctly passing the CSV path here
        const csvPath = path.join(__dirname, 'private_data/dataset.csv');
        const localWeights = await trainLocalModel(data.weights, csvPath);
        
        const payload = {
            clientId: CLIENT_ID,
            roundNumber: data.roundNumber,
            dataSamples: 5, 
            weights: localWeights
        };

        const errMsg = ClientSubmission.verify(payload);
        if (errMsg) throw Error(`Protobuf Verification Error: ${errMsg}`);
        
        const message = ClientSubmission.create(payload);
        const binaryBuffer = ClientSubmission.encode(message).finish();

        console.log("Uploading serialized binary weights to Orchestrator...");
        socket.emit('upload_weights', binaryBuffer);

    } catch (error) {
        console.error("Error during training or serialization:", error);
    }
});