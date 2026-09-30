// Averages the weights across all client submissions
function federatedAveraging(clientSubmissions) {
    const numClients = clientSubmissions.length;
    const numWeights = clientSubmissions[0].weights.length;
    
    let averagedWeights = new Array(numWeights).fill(0);

    // Sum all weights
    for (let i = 0; i < numClients; i++) {
        for (let j = 0; j < numWeights; j++) {
            averagedWeights[j] += clientSubmissions[i].weights[j];
        }
    }

    // Divide by total clients to get the arithmetic mean
    for (let j = 0; j < numWeights; j++) {
        averagedWeights[j] = averagedWeights[j] / numClients;
    }

    return averagedWeights;
}

module.exports = { federatedAveraging };