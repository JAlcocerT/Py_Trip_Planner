import dash
from dash import html, dcc, callback, Input, Output, State
import dash_leaflet as dl
from dash_chat import ChatComponent
from datetime import datetime, timedelta, date
from meteostat import Point
from meteostat import Daily as MeteoDaily
from meteostat import Stations  # new in v1.2
from openmeteo_py import Hourly, Options, OWmanager  # new in V2
from openmeteo_py import Daily as OpenMeteoDaily  # new in V2
import pandas as pd  # new in V2
import plotly.graph_objects as go  # new in V2
import plotly.express as px
from helpers.plot_weather import plot_tmax_boxplot, plot_weather_data, plot_forecast_data_hourly


import os

from openai import OpenAI


#import os
from dotenv import load_dotenv
#from openai import OpenAI

load_dotenv()


#api_key = os.environ.get("OPENAI_API_KEY")
#client = OpenAI(api_key=api_key)
client = OpenAI()

# Load environment variables
load_dotenv()

# Initialize OpenAI client
#api_key = os.environ.get("OPENAI_API_KEY")
#client = OpenAI(api_key=api_key)
client = OpenAI()

# Initialize Dash app
app = dash.Dash(__name__, external_stylesheets=['https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css'])

# def load_html(file_path):
#     with open(file_path, 'r') as f:
#         content = f.read()
#     return html.Div(
#         dangerously_set_inner_html=content
#     )

app.layout = html.Div(
    style={'backgroundColor': '#F5F5F5'},
    children=[
        html.H1('Trip Planner', style={'textAlign': 'center', 'padding': '20px', 'backgroundColor': 'F5F5F5'}),
        dcc.DatePickerRange(
            id='date-picker',
            min_date_allowed=datetime(2000, 1, 1),
            max_date_allowed=date.today() - timedelta(days=7),
            start_date=datetime(2021, 1, 1),
            end_date=datetime(2022, 12, 31),
            display_format='MMM DD, YYYY',
            style={
                'font-size': '6px', 'display': 'inline-block', 'border-radius': '2px',
                'border': '1px solid #ccc', 'color': '#2E2E33',
                'border-spacing': '0', 'border-collapse': 'separate'
            }
        ),
        dl.Map(
            [dl.TileLayer(), dl.LayerGroup(id="layer")],
            id='map',
            style={'width': '100%', 'height': '50vh', 'margin': "auto", "display": "block"},
            center=[35, 25],
            zoom=4,
        ),
        html.H2('Historical Weather Data', style={'textAlign': 'center', 'padding': '20px'}),
        dcc.Graph(id='weather-plot'),
        html.Label('Select a variable to display in the Boxplot:'),
        dcc.Dropdown(
            id='boxplot-variable',
            options=[
                {'label': 'Temperature Max °C', 'value': 'tmax'},
                {'label': 'Temperature Min °C', 'value': 'tmin'},
                {'label': 'Wind (km/h)', 'value': 'wspd'},
                {'label': 'Rain (mm)', 'value': 'prcp'},
            ],
            value='tmax'
        ),
        dcc.Graph(id='tmax-boxplot'),
        html.H2('Forecasted Weather Data', style={'textAlign': 'center', 'padding': '20px'}),
        dcc.Graph(id='forecast-plot'),
        #ABOUT
        # html.Div(
        #     [
        #         load_html('about.html')
        #     ],
        #     style={'display': 'flex', 'justify-content': 'center', 'align-items': 'center', 'display': 'inline-block', 'backgroundColor': '#F5F5F5'}
        # ),
        # Chat component at the bottom
        ChatComponent(
            id="chat-component",
            messages=[
                {"role": "assistant", "content": "Hello!"},
            ],
        )
    ]
)

# Initialize global variables
nearest_lat, nearest_lon = 35, 25

@app.callback(
    Output('layer', 'children'),
    [Input('map', 'click_lat_lng')],
)
def update_markers(click_lat_lng):
    if not click_lat_lng:
        click_lat_lng = [35, 25]
    return [
        dl.Marker(position=click_lat_lng, children=dl.Tooltip(f"({click_lat_lng[0]:.2f}, {click_lat_lng[1]:.2f})")),
        dl.CircleMarker(center=[nearest_lat, nearest_lon], color="#188399",)
    ]

@app.callback(
    [Output('weather-plot', 'figure'), Output('tmax-boxplot', 'figure'), Output('forecast-plot', 'figure')],
    [Input('map', 'click_lat_lng'), Input('date-picker', 'start_date'), Input('date-picker', 'end_date'), Input('boxplot-variable', 'value')],
)
def update_weather_plots(click_lat_lng, start_date, end_date, boxplot_variable):
    global nearest_lat, nearest_lon
    if not click_lat_lng:
        lat, lon = 35, 25
    else:
        lat = int(click_lat_lng[0])
        lon = int(click_lat_lng[1])
    
    # Get nearby weather stations - V1.2
    stations = Stations()
    stations = stations.nearby(lat, lon) 
    station = stations.fetch(1)  # the closest station to the input location

    nearest_lat = station['latitude'].values[0]
    nearest_lon = station['longitude'].values[0]
    
    start = datetime(int(start_date[0:4]), int(start_date[5:7]), int(start_date[8:10]))
    end = datetime(2022, 12, 31)
    
    line_plot = plot_weather_data(nearest_lat, nearest_lon, start, end)
    
    box_plot = plot_tmax_boxplot(nearest_lat, nearest_lon, start, end, boxplot_variable)
    
    try:
        forecast_plot = plot_forecast_data_hourly(nearest_lat, nearest_lon)
    except:
        forecast_plot = go.Figure()
    
    return line_plot, box_plot, forecast_plot

@app.callback(
    Output("chat-component", "messages"),
    Input("chat-component", "new_message"),
    State("chat-component", "messages"),
    prevent_initial_call=True,
)
def handle_chat(new_message, messages):
    if not new_message:
        return messages

    updated_messages = messages + [new_message]

    if new_message["role"] == "user":
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=updated_messages,
            temperature=1.0,
            max_tokens=150,
        )

        bot_response = {"role": "assistant", "content": response.choices[0].message.content.strip()}
        return updated_messages + [bot_response]

    return updated_messages

if __name__ == "__main__":
    app.run_server(debug=True)