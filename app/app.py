import dash
from dash import html 
from dash import dcc
from dash.dependencies import Input, Output

from datetime import datetime, timedelta, date

from meteostat import Point, Daily
from meteostat import Stations #new in v1.2

import plotly.express as px
import dash_leaflet as dl

#from jupyter_dash import JupyterDash

#app = JupyterDash(__name__, external_stylesheets=['https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css'])
app = dash.Dash(__name__, external_stylesheets=['https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css'])

def plot_tmax_boxplot(lat, lon, start, end, variable):
    location = Point(lat, lon)
    
    data = Daily(location, start, end)
    data = data.fetch()

    data = data.reset_index()

    data['month'] = data['time'].dt.month_name()

    fig = px.box(data, x='month', y=variable, title='Monthly Summaries -  Boxplot')

    fig.update_xaxes(title_text='Month')
    fig.update_yaxes(title_text=('Max Temperature (°C)' if variable == 'tmax' else
                              'Min Temperature (°C)' if variable == 'tmin' else
                              'Wind (km/h)' if variable == 'wspd' else
                              'Rain (mm)'))
    return fig

def plot_weather_data(lat, lon, start, end):
    location = Point(lat, lon)
    
    data = Daily(location, start, end)
    data = data.fetch()

    data = data.reset_index()

    # Rename the columns
    data = data.rename(columns={'tmin': 'Tmin',
                           'tmax': 'Tmax'})

    fig = px.line(data, x='time', y=['Tmin', 'Tmax'],
                  title=f'Temperature Min/Max for the Given Location ({lat:.2f}, {lon:.2f})',
                  labels={'time': 'Date'})
    fig.update_yaxes(title_text='Temperature °C')

    fig.data[0].name = 'Tmin'
    fig.data[1].name = 'Tmax'

    # Update the legend title
    fig.update_layout(legend_title='Legend')

    return fig


app.layout = html.Div([
    html.H1('Trip Planner', style={'textAlign': 'center', 'padding': '20px'}),
    dcc.DatePickerRange(
        id='date-picker',
        min_date_allowed=datetime(2000, 1, 1),
        max_date_allowed= date.today() - timedelta(days=7),
        start_date=datetime(2021, 1, 1),
        end_date=datetime(2022, 12, 31),
        display_format='MMM DD, YYYY',
        style = {
                        'font-size': '6px','display': 'inline-block', 'border-radius' : '2px', 
                        'border' : '1px solid #ccc', 'color': '#333', 
                        'border-spacing' : '0', 'border-collapse' :'separate'
                        } 
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
    html.Div([
        html.H4("About"),
        html.A("My Blog - FossEngineer", href="https://fossengineer.com", target="_blank"),
        html.Br(),
        html.A("About this App - FossEngineer", href="https://fossengineer.com/python-trip-planner/", target="_blank"),
        html.Br(),
        html.A("Source Code", href="https://github.com/JAlcocerT/Py_Trip_Planner/", target="_blank"),
    ], style={'float': 'right'})
])

@app.callback(
    Output('layer', 'children'),
    [Input('map', 'click_lat_lng')],
)
# def update_markers(click_lat_lng):
#     if not click_lat_lng:
#         click_lat_lng = [35, 25]
#     return [dl.Marker(position=click_lat_lng, children=dl.Tooltip(f"({click_lat_lng[0]:.2f}, {click_lat_lng[1]:.2f})"))]

def update_markers(click_lat_lng):
    if not click_lat_lng:
        click_lat_lng = [35, 25]
    return [
        dl.Marker(position=click_lat_lng, children=dl.Tooltip(f"({click_lat_lng[0]:.2f}, {click_lat_lng[1]:.2f})")),
        #dl.Marker(position=[nearest_alt, nearest_lon], children=dl.Tooltip(f"({nearest_alt:.2f}, {nearest_lon:.2f})"))
        dl.CircleMarker(center=[nearest_alt, nearest_lon], color="#188399",)
    ]

@app.callback(
    [Output('weather-plot', 'figure'), Output('tmax-boxplot', 'figure')],
    [Input('map', 'click_lat_lng'), Input('date-picker', 'start_date'), Input('date-picker', 'end_date'), Input('boxplot-variable', 'value')],
)
def update_weather_plots(click_lat_lng, start_date, end_date, boxplot_variable):
    global nearest_alt, nearest_lon
    if not click_lat_lng:
        lat, lon = 35, 25
    else:
        lat = int(click_lat_lng[0])
        lon = int(click_lat_lng[1])
    
   # Get nearby weather stations  - V1.2
    stations = Stations()
    stations = stations.nearby(lat, lon) 
    station = stations.fetch(1) #the closest station to the input location

    nearest_alt = station['latitude'].values[0]
    nearest_lon = station['longitude'].values[0]
    ###

    print(nearest_alt,nearest_lon,'versus: ',lat,lon)

    start = datetime(int(start_date[0:4]),
                    int(start_date[5:7]),
                    int(start_date[8:10]))
    end = datetime(2022, 12, 31)
    
    #line_plot = plot_weather_data(lat, lon, start, end)
    line_plot = plot_weather_data(nearest_alt, nearest_lon, start, end)
    
    #box_plot = plot_tmax_boxplot(lat, lon, start, end, boxplot_variable)
    box_plot = plot_tmax_boxplot(nearest_alt, nearest_lon, start, end, boxplot_variable)
    
    return line_plot, box_plot
    
# Start of the application
if __name__ == '__main__':
    
    app.run_server(debug=False, host="0.0.0.0", port=8050)