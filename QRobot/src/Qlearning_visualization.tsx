import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, Plus, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const QLearningSim = () => {
  // Base states for simulation control
  const [gridSize, setGridSize] = useState(5); // Dynamic grid size
  const [qTable, setQTable] = useState({});
  const [goalPositions, setGoalPositions] = useState([{ x: gridSize - 1, y: 0 }]); // Multiple goals
  const [isRunning, setIsRunning] = useState(false); // Simulation running state
  const [episode, setEpisode] = useState(0); // Episode counter
  const [steps, setSteps] = useState(0); // Step counter
  const [successfulEpisodes, setSuccessfulEpisodes] = useState(0); // Counts successful episodes
  const [successfulSteps, setSuccessfulSteps] = useState([]); // Stores steps in successful episodes
  const [failureThreshold, setFailureThreshold] = useState(2); // Failure threshold multiplier
  const [lastUpdated, setLastUpdated] = useState(null); // Last updated agent position
  const [previousPath, setPreviousPath] = useState([]); // Path of previous episode
  const [currentPath, setCurrentPath] = useState([]); // Current path of episode
  const [previousEpisodeSuccess, setPreviousEpisodeSuccess] = useState(true); // Success status of previous episode
  const [obstacles, setObstacles] = useState([]); // Stores obstacles
  const [placingObstacle, setPlacingObstacle] = useState(false); // Mode to place obstacles
  const [placingGoal, setPlacingGoal] = useState(false); // Mode to place goals
  const [allowRevisit, setAllowRevisit] = useState(true); // Allows revisit by default
  const [resetQOnObstacle, setResetQOnObstacle] = useState(false); // Disable Q-value reset by default
  const [sendDataToAPI, setSendDataToAPI] = useState(false); // API data sending off by default
  const [removingObject, setRemovingObject] = useState(false); // Remove goal/obstacle mode
  const [decayFactor, setDecayFactor] = useState(0.99); // Q-value decay factor
  const [isGlobalDecayEnabled, setIsGlobalDecayEnabled] = useState(false); // Global decay off by default
  const [placingStartPosition, setPlacingStartPosition] = useState(false); // Start position mode
  const [startPosition, setStartPosition] = useState({ x: 0, y: gridSize - 1 }); // Initial agent start position
  const [agentPos, setAgentPos] = useState(startPosition); // Place agent at bottom-left initially

// Send episode data to API if enabled
const sendProgressToAPI = async (episode, stats, qTable, steps) => {
  if (!sendDataToAPI) return;

  const data = {
    episode,
    totalRewards: stats.totalRewards,
    averageSteps: stats.averageSteps,
    successRate: stats.successRate,
    learningRate,
    discountFactor,
    epsilon,
    speed,
    failureThreshold,
    qTable,
    steps,
    goalPositions,
    obstacles,
    gridSize
  };

  try {
    const response = await fetch('http://localhost:3001/api/q-learning', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log('Q-Learning data sent to API');
    } else {
      console.error('Failed to send data to API');
    }
  } catch (error) {
    console.error('Error sending data to API:', error);
  }
};

  // Increase grid size, limit to 100
  const increaseGridSize = () => {
    setGridSize((prevSize) => Math.min(prevSize + 1, 100));
  };

  // Decrease grid size, limit to 3
  const decreaseGridSize = () => {
    setGridSize((prevSize) => Math.max(prevSize - 1, 3));
  };

  // Adjustable parameters for Q-learning
  const [learningRate, setLearningRate] = useState(0.1);
  const [discountFactor, setDiscountFactor] = useState(0.9);
  const [epsilon, setEpsilon] = useState(0.1);
  const [speed, setSpeed] = useState(200);

  // Stats tracking for simulation
  const [stats, setStats] = useState({
    totalRewards: 0,
    averageSteps: 0, // Average steps in successful episodes
    successRate: 0,
    episodes: []
  });

  // Available actions for the agent
  const ACTIONS = ['up', 'right', 'down', 'left'];

  // Initialize Q-table based on grid size
  useEffect(() => {
    initQTable();
  }, [gridSize]);

  const initQTable = () => {
    const newQTable = {};
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        newQTable[`${i},${j}`] = {
          up: 0,
          right: 0,
          down: 0,
          left: 0
        };
      }
    }
    setQTable(newQTable);
    setAgentPos(startPosition);
    setGoalPositions([{ x: gridSize - 1, y: 0 }]);
    setObstacles([]);
  };

  // Helpers to calculate state and rewards
  const getStateKey = (pos) => `${pos.x},${pos.y}`;

  const getReward = (newPos) => {
    if (goalPositions.some(goal => goal.x === newPos.x && goal.y === newPos.y)) return 100;
    return -1;
  };

  const isBlocked = (pos) => obstacles.some(obstacle => obstacle.x === pos.x && obstacle.y === pos.y);

  const getNextPosition = (currentPos, action) => {
    const newPos = { ...currentPos };
    switch (action) {
      case 'up':
        newPos.y = Math.max(0, newPos.y - 1);
        break;
      case 'right':
        newPos.x = Math.min(gridSize - 1, newPos.x + 1);
        break;
      case 'down':
        newPos.y = Math.min(gridSize - 1, newPos.y + 1);
        break;
      case 'left':
        newPos.x = Math.max(0, newPos.x - 1);
        break;
    }

    if (isBlocked(newPos)) return currentPos;
    if (!allowRevisit && currentPath.some(pos => pos.x === newPos.x && pos.y === newPos.y)) {
      return currentPos;
    }

    return newPos;
  };

  // Choose action based on epsilon-greedy policy
  const chooseAction = (state) => {
    if (Math.random() < epsilon) {
      return ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    }
    const stateActions = qTable[state];
    return ACTIONS.reduce((best, current) => 
      (stateActions[current] > stateActions[best] ? current : best), ACTIONS[0]
    );
  };

  // Main simulation step
  const step = () => {
    const currentState = getStateKey(agentPos);
    const action = chooseAction(currentState);
    const newPos = getNextPosition(agentPos, action);
    const reward = getReward(newPos);
    const nextState = getStateKey(newPos);

    // Update Q-value for chosen action
    const oldValue = qTable[currentState][action];
    const nextMax = Math.max(...Object.values(qTable[nextState]));
    const newValue = (1 - learningRate) * oldValue + 
                     learningRate * (reward + discountFactor * nextMax);

    setQTable(prev => ({
      ...prev,
      [currentState]: {
        ...prev[currentState],
        [action]: newValue
      }
    }));

    // Apply global decay if enabled
    if (isGlobalDecayEnabled) {
      applyDecayToAllQValues();
    }

    setLastUpdated(agentPos);
    setCurrentPath((prev) => [...prev, agentPos]);
    setStats(prev => ({
      ...prev,
      totalRewards: prev.totalRewards + reward
    }));

    setAgentPos(newPos);
    setSteps(s => s + 1);

    const averageSteps = stats.averageSteps || 50;

    // Check if agent reached a goal
    if (goalPositions.some(goal => goal.x === newPos.x && goal.y === newPos.y)) {
      setCurrentPath((prev) => [...prev, newPos]);
      setSuccessfulEpisodes(prev => prev + 1);
      setSuccessfulSteps(prev => [...prev, steps]);

      const newEpisodes = [...stats.episodes, steps];
      setPreviousPath(currentPath);
      setCurrentPath([]);
      setPreviousEpisodeSuccess(true);

      setStats(prev => ({
        ...prev,
        episodes: newEpisodes,
        averageSteps: successfulSteps.length > 0 
          ? successfulSteps.reduce((a, b) => a + b, 0) / successfulSteps.length
          : steps,
        successRate: ((successfulEpisodes + 1) / (episode + 1)) * 100
      }));

      setEpisode(e => e + 1);
      setAgentPos(startPosition);
      setSteps(0);

      // Send data to API after each successful episode
      sendProgressToAPI(episode + 1, stats, qTable, steps);

    } else if (steps >= averageSteps * failureThreshold) {
      // End episode on step limit failure
      setStats(prev => ({
        ...prev,
        successRate: (successfulEpisodes / (episode + 1)) * 100
      }));
      setPreviousPath([...currentPath, newPos]);
      setCurrentPath([]);
      setPreviousEpisodeSuccess(false);

      setEpisode(e => e + 1);
      setAgentPos(startPosition);
      setSteps(0);

      // Send data to API after each failed episode
      sendProgressToAPI(episode + 1, stats, qTable, steps);
    }
  };

  // Run step function on interval if simulation is active
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(step, speed);
    }
    return () => clearInterval(interval);
  }, [isRunning, agentPos, speed, learningRate, discountFactor, epsilon, failureThreshold]);

  // Reset simulation state and API state
  const resetSimulation = () => {
    setQTable({});
    initQTable();
    setAgentPos(startPosition);
    setEpisode(0);
    setSuccessfulEpisodes(0);
    setSuccessfulSteps([]);
    setSteps(0);
    setPreviousPath([]);
    setCurrentPath([]);
    setPreviousEpisodeSuccess(true);
    setStats({
      totalRewards: 0,
      averageSteps: 0,
      successRate: 0,
      episodes: []
    });
    setIsRunning(false);
    setLastUpdated(null);
    setObstacles([]);
    resetAPIState();
  };

  // Reset API state independently
  const resetAPIState = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/q-learning/reset', {
        method: 'POST'
      });
      if (response.ok) {
        console.log('API state reset successfully');
      } else {
        console.error('Failed to reset API state');
      }
    } catch (error) {
      console.error('Error resetting API state:', error);
    }
  };

  // Handle cell click for placing obstacles, goals, or start position
  const handleCellClick = (x, y) => {
    if (placingStartPosition) {
      setStartPosition({ x, y });
      setAgentPos({ x, y });
      setPlacingStartPosition(false);
    } else if (removingObject) {
      setGoalPositions((prevGoals) => prevGoals.filter(goal => !(goal.x === x && goal.y === y)));
      setObstacles((prevObstacles) => prevObstacles.filter(obstacle => !(obstacle.x === x && obstacle.y === y)));
      setRemovingObject(false);
    } else if (placingObstacle) {
      setObstacles((prev) => [...prev, { x, y }]);
      if (resetQOnObstacle) {
        setQTable((prevQTable) => ({
          ...prevQTable,
          [`${x},${y}`]: { up: 0, right: 0, down: 0, left: 0 }
        }));
      }
      setPlacingObstacle(false);
    } else if (placingGoal) {
      setGoalPositions((prev) => [...prev, { x, y }]);
      setPlacingGoal(false);
    } else {
      setGoalPositions([{ x, y }]);
    }
  };

  // Helper functions and components for sliders and display colors
  const Slider = ({ label, value, onChange, min, max, step, color }) => (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between">
        <label className="text-sm font-medium" style={{ color }}>{label}: {value}</label>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );

  const getValueColor = (value) => {
    if (value > 0) {
      return `rgba(0, 255, 0, ${Math.min(Math.abs(value) / 100, 0.8)})`;
    } else if (value < 0) {
      const intensity = Math.min(Math.abs(value) / 9, 1);
      return `rgba(255, 69, 0, ${intensity})`;
    }
    return 'transparent';
  };

  const applyDecayToAllQValues = () => {
    setQTable(prevQTable => {
      const newQTable = { ...prevQTable };
      for (const stateKey in newQTable) {
        if (stateKey !== getStateKey(agentPos)) {
          newQTable[stateKey] = Object.fromEntries(
            Object.entries(newQTable[stateKey]).map(([action, qValue]) => [action, qValue * decayFactor])
          );
        }
      }
      return newQTable;
    });
  };

  const Cell = ({ x, y, qValues, isAgent, isGoal, isLastUpdated }) => {
    const isPreviousPath = previousPath.some(pos => pos.x === x && pos.y === y);
    const isObstacle = obstacles.some(obstacle => obstacle.x === x && obstacle.y === y);
    const isGoalCell = goalPositions.some(goal => goal.x === x && goal.y === y);
    const isStartPosition = startPosition.x === x && startPosition.y === y;
    const pathColor = previousEpisodeSuccess ? 'bg-blue-100' : 'bg-red-100';

    return (
      <div 
        onClick={() => handleCellClick(x, y)}
        className={`relative transition-all duration-300
          ${isAgent ? 'bg-blue-200' : ''}
          ${isStartPosition ? 'bg-blue-200' : ''}
          ${isGoalCell ? 'bg-green-200' : ''}
          ${isLastUpdated ? 'animate-pulse' : ''}
          ${isObstacle ? 'bg-gray-600' : ''}
          ${isPreviousPath ? pathColor : ''}`}  
        style={{
          width: `calc(80vmin / ${gridSize})`,
          height: `calc(80vmin / ${gridSize})`,
          border: '1px solid #8a8a8a'
        }}
      >
        {isStartPosition && <div className="absolute inset-0 flex items-center justify-center text-6xl">🚦</div>}
        {isAgent && <div className="absolute inset-0 flex items-center justify-center text-6xl">🤖</div>}
        {isGoalCell && <div className="absolute inset-0 flex items-center justify-center text-6xl">🎯</div>}
        {isObstacle && <div className="absolute inset-0 flex items-center justify-center text-6xl text-white">🧱</div>}
        
        <div 
          className="absolute top-0 left-0 w-full text-xs text-center px-1 py-0.5 rounded transition-colors duration-300" 
          style={{ backgroundColor: getValueColor(qValues.up) }}
        >
          {qValues.up.toFixed(1)}
        </div>
        <div 
          className="absolute bottom-0 left-0 w-full text-xs text-center px-1 py-0.5 rounded transition-colors duration-300" 
          style={{ backgroundColor: getValueColor(qValues.down) }}
        >
          {qValues.down.toFixed(1)}
        </div>
        <div 
          className="absolute top-1/2 left-0 transform -translate-y-1/2 text-xs text-center px-1 py-0.5 rounded transition-colors duration-300" 
          style={{ backgroundColor: getValueColor(qValues.left) }}
        >
          {qValues.left.toFixed(1)}
        </div>
        <div 
          className="absolute top-1/2 right-0 transform -translate-y-1/2 text-xs text-center px-1 py-0.5 rounded transition-colors duration-300" 
          style={{ backgroundColor: getValueColor(qValues.right) }}
        >
          {qValues.right.toFixed(1)}
        </div>
      </div>
    );
  };

  const Legend = () => (
    <div className="flex flex-wrap gap-4 p-4 bg-gray-100 rounded-lg">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-blue-200"></div>
        <span>Agent</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-green-200"></div>
        <span>Goal</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-600"></div>
        <span>Obstacle</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4" style={{ background: 'rgba(0, 255, 0, 0.8)' }}></div>
        <span>Positive Q-value</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4" style={{ background: 'rgba(255, 69, 0, 0.8)' }}></div>
        <span>Negative Q-value</span>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle>Q-Learning Visualization</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="grid  gap-4">
            <div className="space-y-4">
              <Slider 
                label="Learning Rate (α)" 
                value={learningRate}
                onChange={setLearningRate}
                min={0}
                max={1}
                step={0.1}
                color="#3B82F6"
              />
              <Slider 
                label="Discount Factor (γ)" 
                value={discountFactor}
                onChange={setDiscountFactor}
                min={0}
                max={1}
                step={0.1}
                color="#10B981"
              />
              <Slider 
                label="Epsilon (ε)" 
                value={epsilon}
                onChange={setEpsilon}
                min={0}
                max={1}
                step={0.1}
                color="#6366F1"
              />
              <Slider 
                label="Speed (ms)" 
                value={speed}
                onChange={setSpeed}
                min={0.1}
                max={1000}
                step={2}
                color="#EC4899"
              />
              <Slider 
                label="Step Limit Multiplier (x)" 
                value={failureThreshold}
                onChange={setFailureThreshold}
                min={1}
                max={100}
                step={0.5}
                color="#F97316"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={allowRevisit} 
              onChange={() => setAllowRevisit(!allowRevisit)} 
            />
            <label>Allow Revisit</label>
          </div>
              <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          checked={isGlobalDecayEnabled} 
          onChange={() => setIsGlobalDecayEnabled(!isGlobalDecayEnabled)} 
        />
<label>Enable global decay of Q-values</label>
      </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={resetQOnObstacle} 
              onChange={() => setResetQOnObstacle(!resetQOnObstacle)} 
            />
            <label>Reset Q-values on Obstacle Placement</label>
          </div>

          {/* Checkbox for enabling/disabling API data sending */}
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={sendDataToAPI} 
              onChange={() => setSendDataToAPI(!sendDataToAPI)} 
            />
            <label>Send Data to API</label>
          </div>

          <div className="flex items-center gap-4 justify-center p-4">
            <button 
              onClick={decreaseGridSize}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              <Minus className="w-4 h-4" />
            </button>

            <span>Grid Size: {gridSize}</span>

            <button 
              onClick={increaseGridSize}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Simulation control buttons */}
          <div className="flex flex-wrap gap-4 justify-center items-center p-4">
            <button 
              onClick={() => setIsRunning(!isRunning)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button 
              onClick={step}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              <FastForward className="w-4 h-4" />
              Step
            </button>
            <button 
              onClick={resetSimulation}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={() => setPlacingStartPosition(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Place Start
            </button>
            <button
              onClick={() => setPlacingObstacle(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Place Obstacle
            </button>
            <button
              onClick={() => setPlacingGoal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Place Goal
            </button>
            <button
              onClick={() => setRemovingObject(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Remove Object
            </button>
          </div>

          {/* Stats and Grid */}
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-4">
              <div className="flex flex-col items-center">
                <div className="text-sm font-medium">Success Rate:</div>
                <div className="text-sm">{stats.successRate.toFixed(1)}%</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-sm font-medium">Episodes:</div>
                <div className="text-sm">{episode}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-sm font-medium">Current Steps:</div>
                <div className="text-sm">{steps}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-sm font-medium">Total Rewards:</div>
                <div className="text-sm">{stats.totalRewards}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-sm font-medium">Average Steps:</div>
                <div className="text-sm">{stats.averageSteps.toFixed(1)}</div>
              </div>
            </div>
          </div>

          {/* Grid display */}
          <div className="grid-wrapper">
            <div 
              className="grid" 
              style={{
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`, 
                gridTemplateRows: `repeat(${gridSize}, 1fr)`,
                width: '80vmin',
                height: '80vmin'
              }}
            >
              {Array.from({ length: gridSize }, (_, y) => (
                Array.from({ length: gridSize }, (_, x) => (
                  <Cell 
                    key={`${x},${y}`}
                    x={x}
                    y={y}
                    qValues={qTable[`${x},${y}`] || { up: 0, right: 0, down: 0, left: 0 }}
                    isAgent={agentPos.x === x && agentPos.y === y}
                    isGoal={goalPositions.some(goal => goal.x === x && goal.y === y)}
                    isLastUpdated={lastUpdated?.x === x && lastUpdated?.y === y}
                  />
                ))
              ))}
            </div>
          </div>

          <Legend />
        </div>
      </CardContent>
    </Card>
  );
};

export default QLearningSim;
