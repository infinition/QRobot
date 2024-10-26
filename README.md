# QRobot

![QRobot](https://github.com/user-attachments/assets/d00301be-045d-4131-bbac-2fe1b4eee76b)

QRobot is a Q-learning simulation application where an agent learns to navigate a grid, reach goals, and avoid obstacles. The application includes an optional API for real-time data visualization.

---
![image](https://github.com/user-attachments/assets/ee0fd508-400d-4c5e-86ab-926caa861b7e)

## Table of Contents
1. [Cloning the Repository](#1-cloning-the-repository)
2. [API Server for Data Visualization](#2-api-server-for-data-visualization)
3. [Launching the Main QRobot Application](#3-launching-the-main-qrobot-application)
4. [Configuration Options](#4-configuration-options)
   - [Sliders](#sliders)
   - [Checkboxes](#checkboxes)
   - [Grid Size](#grid-size)
5. [Control Buttons](#5-control-buttons)
6. [Data Visualization with Graph_Python](#6-data-visualization-with-graph_python)
   - [Visualization Options](#visualization-options)
7. [API Testing (Optional)](#7-api-testing-optional)

---

## 1. Cloning the Repository

To get started, clone the GitHub repository:

```bash
git clone https://github.com/infinition/QRobot.git
cd QRobot
```

---

## 2. API Server for Data Visualization (Optional)

To enable real-time data visualization, start the API server:

```bash
cd API_Server
node api_server.js
```

---

## 3. Launching the Main QRobot Application

To launch the QRobot application:

1. Install dependencies (if not already installed):
   ```bash
   cd QRobot
   npm install
   ```
2. Run the application:
   ```bash
   npm run dev
   ```
3. Open the application at [http://localhost:5173/](http://localhost:5173/)

![image](https://github.com/user-attachments/assets/bf2df06a-6809-463e-9cc0-a21aba58c01d)

   
5. **Important**: Check the "Send Data to API" box to activate real-time data visualization (if the API server is running).

---

## 4. Configuration Options

### Sliders
The following parameters can be adjusted to influence the agent’s behavior:

- **Learning Rate (α)**: Controls how quickly the agent learns by setting the proportion of new Q-values that replace old ones.
- **Discount Factor (γ)**: Defines the value of future rewards; a γ close to 0 makes the agent focus on immediate rewards, while a γ near 1 emphasizes future rewards.
- **Epsilon (ε)**: Determines the exploration rate; an ε of 0.1 means the agent chooses a random action 10% of the time.
- **Speed (ms)**: Sets the agent's speed in milliseconds.
- **Step Limit Multiplier (x)**: A multiplier based on `average_steps` that determines failure. For example, if `average_steps = 10` and `x = 2`, the agent fails after 20 steps.


### Checkboxes

- **Allow Revisit**: Allows the agent to revisit previously visited cells.
- **Enable Global Decay of Q-values**: Applies decay to Q-values that are no longer visited (experimental).
- **Reset Q-values on Obstacle Placement**: Resets Q-values of a cell when an obstacle is placed on it (experimental).
- **Send Data to API**: Enables real-time data visualization by sending data to the API.

### Grid Size

- **Grid Size**: Adjusts the grid dimensions (e.g., 10x10).

---

## 5. Control Buttons

- **Start**: Starts the agent 🤖.
- **Step**: Moves the agent forward by one step.
- **Reset**: Resets the agent and clears visualization data (if connected to the API).
- **Place Start 🚦**: Sets the agent’s starting position.
- **Place Obstacles 🧱**: Places obstacles on the grid.
- **Place Goal 🎯**: Sets a goal location. Right-click sets a single goal by default; this button allows additional goals for testing.
- **Remove Object**: Removes an object (obstacle, goal, but not start) by clicking on the relevant cell.

---

## 6. Data Visualization with Graph_Python (Optional)

The optional graphical visualization allows real-time tracking of the agent's performance. This includes graphs of cumulative rewards, success rate, average steps, and other learning parameters.
![image](https://github.com/user-attachments/assets/fbd01905-80f0-4011-aab5-a262ee39b0a0)



### Launching Graphical Visualization

To activate real-time graphical visualization of the agent’s performance:

1. Start the visualization script:
   ```bash
   cd Graph_Python
   python GraphPython.py
   ```
2. Open the graph page at [http://127.0.0.1:8050/](http://127.0.0.1:8050/)

### Visualization Options

The visualization page offers several interactive options to customize the display:

- **Display the Last X Epochs**: Shows a specified number of recent epochs, providing a focused view of recent performance.
- **Overlay Graphs**: Combines all graphs into a single chart, overlaying each metric’s curve for easier comparison.
- **Logarithmic Scale**: Activates a logarithmic scale for the y-axes in the graphs, useful for visualizing values that vary widely.

These options allow users to customize the visualization for better tracking of the agent’s progress.

### Overlay + Logarithmic Scale example :

![image](https://github.com/user-attachments/assets/0cbef9ab-fbc0-41a7-8734-f495b262b226)

---

## 7. API Testing (Optional)

To test the API, run the following test script:

```bash
cd API_Server
python test_api.py
```



