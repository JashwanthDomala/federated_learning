import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Connect to the existing Node.js Orchestrator
const socket = io('http://localhost:3000');

function App() {
  const [history, setHistory] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [weights, setWeights] = useState([0.0, 0.0]); // [Slope, Intercept]
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Listen for the broadcast event from the Orchestrator
    socket.on('start_round', (data) => {
      setCurrentRound(data.roundNumber);
      setWeights(data.weights);

      // Append new data to the chart history
      setHistory((prevHistory) => [
        ...prevHistory,
        {
          round: data.roundNumber,
          slope: data.weights[0],
          intercept: data.weights[1],
        }
      ]);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('start_round');
    };
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1>Federated Learning Dashboard</h1>
          <span style={{ 
              padding: '8px 16px', 
              borderRadius: '20px', 
              backgroundColor: isConnected ? '#dcfce7' : '#fee2e2',
              color: isConnected ? '#166534' : '#991b1b',
              fontWeight: 'bold'
          }}>
            {isConnected ? '🟢 Server Connected' : '🔴 Disconnected'}
          </span>
        </header>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
          <div style={cardStyle}>
            <h3>Current Round</h3>
            <p style={metricStyle}>{currentRound}</p>
          </div>
          <div style={cardStyle}>
            <h3>Global Slope (Weight 1)</h3>
            <p style={metricStyle}>{weights[0] ? weights[0].toFixed(4) : '0.0000'}</p>
          </div>
          <div style={cardStyle}>
            <h3>Global Intercept (Weight 2)</h3>
            <p style={metricStyle}>{weights[1] ? weights[1].toFixed(4) : '0.0000'}</p>
          </div>
        </div>

        <div style={{ ...cardStyle, height: '400px', padding: '30px' }}>
          <h3 style={{ marginBottom: '20px' }}>Model Convergence over Time</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="round" label={{ value: 'Training Round', position: 'insideBottomRight', offset: -10 }} />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip />
              <Legend verticalAlign="top" height={36}/>
              <Line type="monotone" dataKey="slope" stroke="#2563eb" strokeWidth={3} name="Global Slope" dot={false} />
              <Line type="monotone" dataKey="intercept" stroke="#16a34a" strokeWidth={3} name="Global Intercept" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

// Basic inline styles for the UI cards
const cardStyle = {
  flex: 1,
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  border: '1px solid #e2e8f0'
};

const metricStyle = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#0f172a',
  margin: '10px 0 0 0'
};

export default App;