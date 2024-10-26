// API server file (api_server.js)

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Variables to store the state of Q-Learning
let qLearningState = {
  episode: 0,
  totalRewards: 0,
  averageSteps: 0,
  successRate: 0,
  learningRate: 0.1,
  discountFactor: 0.9,
  epsilon: 0.1,
  speed: 200,
  failureThreshold: 2,
  qTable: {},
  steps: 0,
  goalPositions: [],
  obstacles: [],
  gridSize: 5
};

// Route to get Q-Learning data
app.get('/api/q-learning', (req, res) => {
  res.json(qLearningState);
});

// Route to update Q-Learning data
app.post('/api/q-learning', (req, res) => {
  qLearningState = { ...qLearningState, ...req.body };
  res.status(200).send('Q-Learning data updated');
});

// Route to reset Q-Learning data
app.post('/api/q-learning/reset', (req, res) => {
  qLearningState = {
    episode: 0,
    totalRewards: 0,
    averageSteps: 0,
    successRate: 0,
    learningRate: 0.1,
    discountFactor: 0.9,
    epsilon: 0.1,
    speed: 200,
    failureThreshold: 2,
    qTable: {},
    steps: 0,
    goalPositions: [],
    obstacles: [],
    gridSize: 5
  };
  res.status(200).send('Q-Learning state reset');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
