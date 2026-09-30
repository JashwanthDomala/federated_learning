const protobuf = require('protobufjs');
const path = require('path');

// 1. Load the schema
const root = protobuf.loadSync(path.join(__dirname, '../../shared/weights.proto'));
const ClientSubmission = root.lookupType('federated.ClientSubmission');

// 2. Define the function as decodeWeights
function decodeWeights(buffer) {
    const message = ClientSubmission.decode(new Uint8Array(buffer));
    return ClientSubmission.toObject(message, { arrays: true });
}

// 3. Export exactly the name the orchestrator is looking for
module.exports = { decodeWeights };