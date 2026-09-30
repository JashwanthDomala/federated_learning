const tf = require('@tensorflow/tfjs');
const fs = require('fs');

async function trainLocalModel(globalWeights, dataPath) {
    console.log("Loading local CSV data...");
    
    // 1. Read and parse the CSV file natively
    const csvFile = fs.readFileSync(dataPath, 'utf8').trim().split('\n').slice(1);
    const xs = [];
    const ys = [];
    
    csvFile.forEach(line => {
        const [x, y] = line.split(',');
        xs.push(parseFloat(x));
        ys.push(parseFloat(y));
    });

    // Convert arrays to TF Tensors
    const xsTensor = tf.tensor2d(xs, [xs.length, 1]);
    const ysTensor = tf.tensor2d(ys, [ys.length, 1]);

    // 2. Define a simple Linear Regression Model
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
    model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });

    // 3. Apply Global Weights (if provided by Orchestrator)
    if (globalWeights && globalWeights.length === 2) {
        const slope = tf.tensor2d([globalWeights[0]], [1, 1]);
        const intercept = tf.tensor1d([globalWeights[1]]);
        model.setWeights([slope, intercept]);
    }

    // 4. Train the model locally
    console.log("Training TF.js model...");
    await model.fit(xsTensor, ysTensor, { epochs: 50, verbose: 0 });

    // 5. Extract the updated weights
    const newWeightsTensors = model.getWeights();
    const updatedSlope = newWeightsTensors[0].dataSync()[0];
    const updatedIntercept = newWeightsTensors[1].dataSync()[0];
    
    let updatedWeights = [updatedSlope, updatedIntercept];

    // 6. Apply Differential Privacy
    updatedWeights = addGaussianNoise(updatedWeights, 0.01);
    
    return updatedWeights;
}

function addGaussianNoise(weights, noiseMultiplier) {
    return weights.map(w => {
        const noise = (Math.random() - 0.5) * noiseMultiplier;
        return w + noise;
    });
}

module.exports = { trainLocalModel };