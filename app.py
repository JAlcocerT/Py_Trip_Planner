import dash
import dash_html_components as html
#import dash_core_components as dcc
from dash import dcc
from dash.dependencies import Input, Output
from datetime import datetime
from meteostat import Point, Daily

import plotly.express as px
import dash_leaflet as dl
from jupyter_dash import JupyterDash

app = JupyterDash(__name__, external_stylesheets=['https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css'])

def plot_tmax_boxplot(lat, lon, start, end, variable):
    location = Point(lat, lon, 70)
    
    data = Daily(location, start, end)
    data = data.fetch()

    data=data.reset_index()

    data['month'] = data['time'].dt.month

    fig = px.box(data, x='month', y=variable, title='Monthly Tmax Boxplot')
    return fig

def plot_weather_data(lat, lon, start, end):
    location = Point(lat, lon, 70)
    
    data = Daily(location, start, end)
    data = data.fetch()

    data=data.reset_index()

    fig = px.line(data, x='time', y=['tmin','tmax'],
                  title=f'Temperature min/max for the Given Location ({lat:.2f},{lon:.2f})',
                  labels={'time': 'Date', 'tmin': 'Min Temp', 'tmax': 'Max Temp'})

    fig.update_yaxes(title_text='Temperature')


    return (fig)

app.layout = html.Div([
    html.H1('Trip Planner', style={'textAlign': 'center', 'padding': '20px'}),
    dcc.DatePickerRange(
        id='date-picker',
        min_date_allowed=datetime(2000, 1, 1),
        max_date_allowed=datetime(2022, 12, 31),
        start_date=datetime(2021, 1, 1),
        end_date=datetime(2021, 12, 31),
        display_format='MMM DD, YYYY'
    ),
    dl.Map(
        [dl.TileLayer(), dl.LayerGroup(id="layer")],
        id='map',
        style={'width': '100%', 'height': '50vh', 'margin': "auto", "display": "block"},
        center=[35, 25],
        zoom=4,
        #click_lat_lng=True,
    ),
    dcc.Graph(id='weather-plot'),
    html.Label('Select variable for boxplot:'),
    dcc.Dropdown(
        id='boxplot-variable',
        options=[
            {'label': 'Tmax', 'value': 'tmax'},
            {'label': 'Tmin', 'value': 'tmin'}
        ],
        value='tmax'
    ),
    dcc.Graph(id='tmax-boxplot')
])

@app.callback(
    Output('layer', 'children'),
    [Input('map', 'click_lat_lng')],
)
def update_markers(click_lat_lng):
    if not click_lat_lng:
        click_lat_lng = [35, 25]
    return [dl.Marker(position=click_lat_lng, children=dl.Tooltip(f"({click_lat_lng[0]:.2f}, {click_lat_lng[1]:.2f})"))]

@app.callback(
    [Output('weather-plot', 'figure'), Output('tmax-boxplot', 'figure')],
    [Input('map', 'click_lat_lng'), Input('date-picker', 'start_date'), Input('date-picker', 'end_date'), Input('boxplot-variable', 'value')],
)
def update_weather_plots(click_lat_lng, start_date, end_date, boxplot_variable):
    if not click_lat_lng:
        lat, lon = 35, 25
    else:
        lat = int(click_lat_lng[0])
        lon = int(click_lat_lng[1])
    
   
    start = datetime(int(start_date[0:4]),
                    int(start_date[5:7]),
                    int(start_date[8:10]))
    end = datetime(2022, 12, 31)
    
    line_plot = plot_weather_data(lat, lon, start, end)
    
    
    box_plot = plot_tmax_boxplot(lat, lon, start, end, boxplot_variable)
    
    return line_plot, box_plot
    

# Start of the application
if _name_ == '__main__':
    app.run_server(debug=False, host="0.0.0.0", port=8080)
