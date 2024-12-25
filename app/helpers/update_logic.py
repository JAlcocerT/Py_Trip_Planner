from plot_logic import plot_tmax_boxplot, plot_weather_data, plot_forecast_data_hourly


def update_weather_plots(click_lat_lng, start_date, end_date, boxplot_variable):
    global nearest_lat, nearest_lon
    if not click_lat_lng:
        lat, lon = 35, 25
    else:
        lat = int(click_lat_lng[0])
        lon = int(click_lat_lng[1])
    
   # Get nearby weather stations  - V1.2
    stations = Stations()
    stations = stations.nearby(lat, lon) 
    station = stations.fetch(1) #the closest station to the input location

    nearest_lat = station['latitude'].values[0]
    nearest_lon = station['longitude'].values[0]
    
    start = datetime(int(start_date[0:4]),
                    int(start_date[5:7]),
                    int(start_date[8:10]))
    end = datetime(2022, 12, 31)
    
    line_plot = plot_weather_data(nearest_lat, nearest_lon, start, end)
    
    box_plot = plot_tmax_boxplot(nearest_lat, nearest_lon, start, end, boxplot_variable)
    
    try:
        forecast_plot = plot_forecast_data_hourly(nearest_lat, nearest_lon)
    except:
        forecast_plot = go.Figure()
    
    return line_plot, box_plot, forecast_plot


def update_markers(click_lat_lng):
    if not click_lat_lng:
        click_lat_lng = [35, 25]
    return [
        dl.Marker(position=click_lat_lng, children=dl.Tooltip(f"({click_lat_lng[0]:.2f}, {click_lat_lng[1]:.2f})")),
        dl.CircleMarker(center=[nearest_lat, nearest_lon], color="#188399",)
    ]