<p align="center">
  <img src=".github/QRobot.png" alt="QRobot icon" width="340" height="340" />
</p>

 # QRobot

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) ![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white) [![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/infinition)

![QRobot](https://github.com/user-attachments/assets/d00301be-045d-4131-bbac-2fe1b4eee76b)

A interactive Q-learning simulation where an agent learns to navigate a grid, reach goals, and avoid obstacles. The project includes an optional API server for real-time statistical visualization.

![QRobot Grid Layout](https://github.com/user-attachments/assets/ee0fd508-400d-4c5e-86ab-926caa861b7e)

## Setup and Running

### API Server (Optional)
To enable real-time visualization, run the API server first:
```bash
cd API_Server
npm install
node api_server.js
```

### Main Application
Start the simulation UI:
```bash
cd QRobot
npm install
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

![QRobot Interface](https://github.com/user-attachments/assets/bf2df06a-6809-463e-9cc0-a21aba58c01d)

Check the **Send Data to API** option in the UI to stream training data to the server if it is running.

### Graphical Visualization (Optional)
Run the Python dashboard to view training statistics:
```bash
cd Graph_Python
pip install -r requirements.txt
python GraphPython.py
```
Open [http://127.0.0.1:8050/](http://127.0.0.1:8050/) in your browser.

![Dashboard Visualization](https://github.com/user-attachments/assets/fbd01905-80f0-4011-aab5-a262ee39b0a0)

---

## Configuration

### Parameters
- **Learning Rate (alpha)**: Determines how much new information overrides old Q-values.
- **Discount Factor (gamma)**: Determines the importance of future rewards.
- **Epsilon (epsilon)**: Sets the exploration rate for selecting random actions.
- **Speed**: Sets the step delay in milliseconds.
- **Step Limit Multiplier**: Determines step limits before an episode is marked as failed.

### Toggle Options
- **Allow Revisit**: Allows the agent to step on previously visited cells in an episode.
- **Global Decay**: Progressively decays unvisited Q-values over time.
- **Reset on Obstacle**: Resets Q-values of a cell when an obstacle is placed on it.
- **Send Data to API**: Streams live training metrics.

### Grid Editing
- Use **Place Start** to set the agent's initial position.
- Use **Place Obstacles** to draw barriers.
- Use **Place Goal** to define target cells.
- Use **Remove Object** to clear elements from the grid.

---

## API Testing
You can verify the API connection by running:
```bash
cd API_Server
pip install -r requirements.txt
python test_api.py
```

## Star History

<a href="https://www.star-history.com/?repos=infinition%2FQRobot&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=infinition/QRobot&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=infinition/QRobot&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=infinition/QRobot&type=date&legend=top-left" />
 </picture>
</a>

## License

MIT. See [LICENSE](LICENSE).
