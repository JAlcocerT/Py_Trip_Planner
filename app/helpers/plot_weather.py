#

import pandas as pd  #new in V2

import plotly.graph_objects as go  #new in V2
import plotly.express as px
import dash_leaflet as dl

from meteostat import Point#, Daily
from meteostat import Daily as MeteoDaily
from meteostat import Stations #new in v1.2

from openmeteo_py import Hourly,Options,OWmanager #new in V2
from openmeteo_py import Daily as OpenMeteoDaily #new in V2


def plot_tmax_boxplot(lat, lon, start, end, variable):
    location = Point(lat, lon)
    
    data = MeteoDaily(location, start, end)
    data = data.fetch()

    df_meteo_boxplot = data.reset_index()

    df_meteo_boxplot['month'] = df_meteo_boxplot['time'].dt.month_name()

    fig = px.box(df_meteo_boxplot, x='month', y=variable, title='Monthly Summaries -  Boxplot')

    fig.update_xaxes(title_text='Month')
    fig.update_yaxes(title_text=('Max Temperature (°C)' if variable == 'tmax' else
                              'Min Temperature (°C)' if variable == 'tmin' else
                              'Wind (km/h)' if variable == 'wspd' else
                              'Rain (mm)'))

    fig.update_traces(marker_color='#21B1CF', line_color='#21B1CF')


    fig.update_layout(plot_bgcolor='#2E2E33',
                      paper_bgcolor='#F5F5F5')
    
    return fig

def plot_weather_data(lat, lon, start, end):
    location = Point(lat, lon)
    
    data = MeteoDaily(location, start, end)
    data = data.fetch()

    data = data.reset_index()

    # Rename the columns
    df_meteostat = data.rename(columns={'tmin': 'Tmin',
                           'tmax': 'Tmax'})

    fig = px.line(df_meteostat, x='time', y=['Tmin', 'Tmax'],
                  title=f'Temperature Min/Max for the Given Location ({lat:.2f}, {lon:.2f})',
                  labels={'time': 'Date'},
                  color_discrete_sequence=['#66E5FF', 'orange'])
    fig.update_yaxes(title_text='Temperature °C')

    fig.data[0].name = 'Tmin'
    fig.data[1].name = 'Tmax'


    # Update the legend title
    fig.update_layout(legend_title='Legend',
                      plot_bgcolor='#2E2E33',
                      paper_bgcolor='#F5F5F5')

    return fig


def plot_forecast_data_hourly(lat,lon): #new for V2
    import plotly.graph_objects as go

    hourly = Hourly()
    daily = OpenMeteoDaily()
    options = Options(lat,lon)

    mgr = OWmanager(options,
        hourly.all(),
        daily.all())
        
    # Download data
    meteo = mgr.get_data()

    hourly_data = meteo["hourly"]

    df_meteo_h = pd.DataFrame({
            'time': hourly_data['time'],
            'apparent_temperature': hourly_data['apparent_temperature'],
            'windspeed_10m': hourly_data['windspeed_10m'],
            'winddirection_10m': hourly_data['winddirection_10m'],
            'precipitation': hourly_data['precipitation']
        })
   

    fig = go.Figure()

    fig.add_trace(go.Scatter(x=df_meteo_h['time'], y=df_meteo_h['apparent_temperature'], name='Temperature', line=dict(color='#21B1CF')))
    fig.add_trace(go.Scatter(x=df_meteo_h['time'], y=df_meteo_h['windspeed_10m'], name='Wind Speed', line=dict(color='#b1b3b5'), yaxis='y2'))

    fig.update_layout(
        title='Forecast - Temperature and Wind Speed',
        xaxis=dict(title='Time'),
        yaxis=dict(title='Temperature (Celsius)', side='left', color='#21B1CF'),
        yaxis2=dict(title='Wind Speed (km/h)', side='right', overlaying='y', color='#b1b3b5')
    )

    fig.update_layout(plot_bgcolor='#2E2E33',
                        paper_bgcolor='#F5F5F5')

    return fig