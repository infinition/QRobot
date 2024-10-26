import requests
import time

def get_q_learning_data():
    try:
        response = requests.get('http://localhost:3001/api/q-learning')
        response.raise_for_status() 
        data = response.json()
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

try:
    while True:
        q_data = get_q_learning_data()
        if q_data:
            print(
                f"Episode: {q_data.get('episode', 'N/A')}, "
                f"Total Rewards: {q_data.get('totalRewards', 'N/A')}, "
                f"Average Steps: {q_data.get('averageSteps', 'N/A')}, "
                f"Success Rate: {q_data.get('successRate', 'N/A')}, "
                f"Learning Rate: {q_data.get('learningRate', 'N/A')}, "
                f"Discount Factor: {q_data.get('discountFactor', 'N/A')}, "
                f"Epsilon: {q_data.get('epsilon', 'N/A')}, "
                f"Speed: {q_data.get('speed', 'N/A')}, "
                f"Failure Threshold: {q_data.get('failureThreshold', 'N/A')}, "
                f"Goal Counts: {q_data.get('goal_counts', 'N/A')}, "
                f"Obstacle Counts: {q_data.get('obstacle_counts', 'N/A')}, "
                f"Grid Sizes: {q_data.get('grid_sizes', 'N/A')}, "
                f"Q-Table: {q_data.get('qTable', 'N/A')}, "
                f"Steps: {q_data.get('steps', 'N/A')}"
            )
        time.sleep(2)  
except KeyboardInterrupt:
    print("Arrêt de la récupération des données.")
