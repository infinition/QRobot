import dash
from dash import dcc, html
from dash.dependencies import Input, Output, State
import plotly.graph_objs as go
import requests

# Define arrays for storing Q-learning metrics
episodes = []
total_rewards = []
average_steps = []
success_rates = []
cumulative_rewards = []
learning_rates = []
discount_factors = []
epsilons = []
failure_thresholds = []
goal_counts = []
obstacle_counts = []
grid_sizes = []

# Track visibility state of each metric trace
trace_visibility = {
    'Average Steps': True,
    'Success Rate': True,
    'Total Rewards': True,
    'Cumulative Rewards': True,
    'Learning Rate': True,
    'Discount Factor': True,
    'Epsilon': True,
    'Failure Threshold': True,
    'Goals': True,
    'Obstacles': True,
    'Grid Size': True
}

# Fetch Q-learning data from API
def get_q_learning_data():
    try:
        response = requests.get('http://localhost:3001/api/q-learning')
        response.raise_for_status()  # Raise exception for HTTP errors
        data = response.json()
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

# Reset Q-learning API state
def reset_q_learning_data():
    try:
        response = requests.post('http://localhost:3001/api/q-learning/reset')
        if response.status_code == 200:
            print("API state reset successfully")
        else:
            print(f"Failed to reset API state: {response.status_code}")
    except Exception as e:
        print(f"Error resetting API state: {e}")

# Initialize Dash app
app = dash.Dash(__name__)

# Button styling for dark mode
button_style = {
    'width': '100%',
    'padding': '10px',
    'fontSize': '20px',
    'backgroundColor': '#333333',
    'color': '#FFFFFF',
    'border': '1px solid #444444',
    'borderRadius': '5px',
    'cursor': 'pointer',
    'transition': 'background-color 0.3s',
}

# Main layout with collapsible options
app.layout = html.Div([
    # Toggle button for options menu
    html.Button('Options', id='toggle-options-button', n_clicks=0, style=button_style),
    html.Div(id='options-container', children=[
        # Options buttons
        html.Button('Clear All Data', id='clear-button', n_clicks=0, style=button_style),
        html.Button('Overlay Graphs', id='toggle-graph-button', n_clicks=0, style=button_style),
        html.Button('Logarithmic Scale', id='log-scale-button', n_clicks=0, style=button_style),
        html.Button('Display Last X Epochs', id='last-epochs-button', n_clicks=0, style=button_style),
        dcc.Input(id='epochs-input', type='number', value=100, min=1, style={'width': '100%', 'padding': '10px', 'fontSize': '18px'}),
    ], style={'display': 'block'}),  # Options initially visible

    # Container for graphs
    html.Div(id='graph-layout', children=[
        html.Div([dcc.Graph(id='metric-graph', style={'width': '100%', 'height': '100%'})], style={'grid-area': 'graph1'}),
        html.Div([dcc.Graph(id='reward-graph', style={'width': '100%', 'height': '100%'})], style={'grid-area': 'graph2'}),
        html.Div([dcc.Graph(id='convergence-graph', style={'width': '100%', 'height': '100%'})], style={'grid-area': 'graph3'}),
        html.Div([dcc.Graph(id='params-graph', style={'width': '100%', 'height': '100%'})], style={'grid-area': 'graph4'}),
    ], style={
        'display': 'grid',
        'grid-template-areas': '''
            'graph1 graph2'
            'graph3 graph4'
        ''',
        'grid-template-columns': '50% 50%',
        'grid-template-rows': '50% 50%',
        'height': '90vh'
    }),

    # Interval for real-time updates
    dcc.Interval(
        id='interval-component',
        interval=2*1000,
        n_intervals=0
    )
], style={'backgroundColor': '#333333', 'height': '100vh', 'width': '100vw'})

# Callback for toggling visibility of options
@app.callback(
    Output('options-container', 'style'),
    Input('toggle-options-button', 'n_clicks'),
    prevent_initial_call=True
)
def toggle_options_visibility(n_clicks):
    # Toggle between show and hide for options container
    return {'display': 'none'} if n_clicks % 2 == 1 else {'display': 'block'}

# Callback to manage options buttons: Clear, Overlay, Logarithmic, Display Last Epochs
@app.callback(
    [Output('metric-graph', 'figure'),
     Output('reward-graph', 'figure'),
     Output('convergence-graph', 'figure'),
     Output('params-graph', 'figure'),
     Output('graph-layout', 'style')],
    [Input('interval-component', 'n_intervals'),
     Input('clear-button', 'n_clicks'),
     Input('toggle-graph-button', 'n_clicks'),
     Input('log-scale-button', 'n_clicks'),
     Input('last-epochs-button', 'n_clicks'),
     Input('epochs-input', 'value')],
    [State('metric-graph', 'figure'),
     State('reward-graph', 'figure'),
     State('convergence-graph', 'figure'),
     State('params-graph', 'figure')]
)
def update_graph_live(n, clear_clicks, toggle_clicks, log_scale_clicks, last_epochs_clicks, epochs_value, metric_fig_state, reward_fig_state, convergence_fig_state, params_fig_state):
    # Global variables to store episode data
    global episodes, total_rewards, average_steps, success_rates, cumulative_rewards
    global learning_rates, discount_factors, epsilons, failure_thresholds, goal_counts, obstacle_counts, grid_sizes, trace_visibility

    # Store the current trace visibility state
    if metric_fig_state:
        for trace in metric_fig_state['data']:
            trace_visibility[trace['name']] = trace['visible']
    if reward_fig_state:
        for trace in reward_fig_state['data']:
            trace_visibility[trace['name']] = trace['visible']
    if convergence_fig_state:
        for trace in convergence_fig_state['data']:
            trace_visibility[trace['name']] = trace['visible']
    if params_fig_state:
        for trace in params_fig_state['data']:
            trace_visibility[trace['name']] = trace['visible']

    # Clear data if "Clear All Data" button clicked
    if clear_clicks > 0:
        episodes = []
        total_rewards = []
        average_steps = []
        success_rates = []
        cumulative_rewards = []
        learning_rates = []
        discount_factors = []
        epsilons = []
        failure_thresholds = []
        goal_counts = []
        obstacle_counts = []
        grid_sizes = []
        trace_visibility = {k: True for k in trace_visibility}
        reset_q_learning_data()  # Reset API state

    # Fetch new data from API
    q_data = get_q_learning_data()
    if q_data:
        # Append new data points to the lists
        episodes.append(q_data['episode'])
        total_rewards.append(q_data['totalRewards'])
        average_steps.append(q_data['averageSteps'])
        success_rates.append(q_data['successRate'])
        learning_rates.append(q_data['learningRate'])
        discount_factors.append(q_data['discountFactor'])
        epsilons.append(q_data['epsilon'])
        failure_thresholds.append(q_data['failureThreshold'])
        goal_counts.append(len(q_data.get('goalPositions', [])))
        obstacle_counts.append(len(q_data.get('obstacles', [])))
        grid_sizes.append(q_data.get('gridSize', 5))

        cumulative_rewards.append(
            cumulative_rewards[-1] + q_data['totalRewards'] if cumulative_rewards else q_data['totalRewards']
        )

        # Define epochs to display based on input
        epochs_to_display = epochs_value if epochs_value is not None else len(episodes)
        epochs_to_display = min(epochs_to_display, len(episodes))
        x_range_start = max(0, len(episodes) - epochs_to_display)

        # Toggle for overlay and log scale options
        is_combined = toggle_clicks % 2 != 0
        log_scale = log_scale_clicks % 2 != 0

        # Adjust layout for combined view
        if is_combined:
            graph_layout_style = {
                'display': 'grid',
                'grid-template-areas': '''
                    'graph1 graph1'
                    'graph1 graph1'
                ''',
                'grid-template-columns': '100%',
                'grid-template-rows': '100%',
                'height': '90vh'
            }
            combined_fig = go.Figure()
            for name, y_data in zip(
                ['Average Steps', 'Success Rate', 'Total Rewards', 'Cumulative Rewards', 'Learning Rate', 'Discount Factor', 'Epsilon', 'Failure Threshold', 'Goals', 'Obstacles', 'Grid Size'],
                [average_steps, success_rates, total_rewards, cumulative_rewards, learning_rates, discount_factors, epsilons, failure_thresholds, goal_counts, obstacle_counts, grid_sizes]
            ):
                combined_fig.add_trace(go.Scatter(
                    x=episodes[x_range_start:], y=y_data[x_range_start:],
                    mode='lines+markers',
                    name=name,
                    opacity=0.7,
                    visible=trace_visibility[name] if name in trace_visibility else True
                ))
            combined_fig.update_layout(
                title="All Metrics Combined",
                xaxis_title="Episode",
                yaxis_title="Values",
                template="plotly_dark",
                yaxis_type="log" if log_scale else "linear",
                legend=dict(x=0.05, y=0.95, bgcolor="rgba(0,0,0,0.3)")
            )
            return combined_fig, go.Figure(), go.Figure(), go.Figure(), graph_layout_style

        # Separate layout for individual graphs
        graph_layout_style = {
            'display': 'grid',
            'grid-template-areas': '''
                'graph1 graph2'
                'graph3 graph4'
            ''',
            'grid-template-columns': '50% 50%',
            'grid-template-rows': '50% 50%',
            'height': '90vh'
        }

        # Metric graphs with defined ranges and visibility
        metric_fig = go.Figure()
        metric_fig.add_trace(go.Scatter(
            x=episodes[x_range_start:], y=average_steps[x_range_start:], mode='lines+markers', name='Average Steps', opacity=0.7, visible=trace_visibility['Average Steps']
        ))
        metric_fig.add_trace(go.Scatter(
            x=episodes[x_range_start:], y=success_rates[x_range_start:], mode='lines+markers', name='Success Rate', opacity=0.7, visible=trace_visibility['Success Rate']
        ))
        metric_fig.update_layout(
            title="Average Steps and Success Rate",
            xaxis_title="Episode",
            yaxis_title="Metrics",
            template="plotly_dark",
            legend=dict(x=0.05, y=0.95, bgcolor="rgba(0,0,0,0.3)")
        )

        reward_fig = go.Figure()
        reward_fig.add_trace(go.Scatter(
            x=episodes[x_range_start:], y=total_rewards[x_range_start:], mode='lines+markers', name='Total Rewards', opacity=0.7, visible=trace_visibility['Total Rewards']
        ))
        reward_fig.update_layout(
            title="Total Rewards",
            xaxis_title="Episode",
            yaxis_title="Total Rewards",
            template="plotly_dark",
            legend=dict(x=0.05, y=0.95, bgcolor="rgba(0,0,0,0.3)")
        )

        convergence_fig = go.Figure()
        convergence_fig.add_trace(go.Scatter(
            x=episodes[x_range_start:], y=cumulative_rewards[x_range_start:], mode='lines+markers', name='Cumulative Rewards', opacity=0.7, visible=trace_visibility['Cumulative Rewards']
        ))
        convergence_fig.update_layout(
            title="Convergence (Cumulative Rewards)",
            xaxis_title="Episode",
            yaxis_title="Cumulative Rewards",
            template="plotly_dark",
            legend=dict(x=0.05, y=0.95, bgcolor="rgba(0,0,0,0.3)")
        )

        params_fig = go.Figure()
        for name, y_data in zip(['Learning Rate', 'Discount Factor', 'Epsilon', 'Failure Threshold', 'Goals', 'Obstacles', 'Grid Size'],
                                [learning_rates, discount_factors, epsilons, failure_thresholds, goal_counts, obstacle_counts, grid_sizes]):
            params_fig.add_trace(go.Scatter(
                x=episodes[x_range_start:], y=y_data[x_range_start:], mode='lines+markers', name=name, opacity=0.7, visible=trace_visibility[name]
            ))
        params_fig.update_layout(
            title="Learning Rate, Discount Factor, and Other Parameters",
            xaxis_title="Episode",
            yaxis_title="Parameter Values",
            template="plotly_dark",
            legend=dict(x=0.05, y=0.95, bgcolor="rgba(0,0,0,0.3)")
        )

        return metric_fig, reward_fig, convergence_fig, params_fig, graph_layout_style

    # Return empty figures if no data is available
    return go.Figure(), go.Figure(), go.Figure(), go.Figure(), graph_layout_style

# Run the Dash app server
if __name__ == '__main__':
    app.run_server(debug=True)
