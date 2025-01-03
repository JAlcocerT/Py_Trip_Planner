<div align="center">
  <h1>Python Trip Planner</h1>
</div>

<div align="center">
  <h3>Plan your Trips according to Weather Patters</h3>
</div>

<div align="center">
  <a href="https://github.com/JAlcocerT/Py_Trip_Planner?tab=GPL-3.0-1-ov-file" style="margin-right: 5px;">
    <img alt="Code License" src="https://img.shields.io/badge/License-GPLv3-blue.svg" />
  </a>
  <a href="https://github.com/JAlcocerT/JAlcocerT/Py_Trip_Planner/actions/workflows/Dash_GHA_MultiArch.yml" style="margin-right: 5px;">
    <img alt="GH Actions Workflow" src="https://github.com/JAlcocerT/Py_Trip_Planner/actions/workflows/Dash_GHA_MultiArch.yml/badge.svg" />
  </a>
  <a href="https://GitHub.com/JAlcocerT/Py_Trip_Planner/graphs/commit-activity" style="margin-right: 5px;">
    <img alt="Mantained" src="https://img.shields.io/badge/Maintained%3F-no-grey.svg" />
  </a>
  <a href="https://www.python.org/downloads/release/python-3819/">
    <img alt="Python Version" src="https://img.shields.io/badge/python-3.8-blue.svg" />
  </a>
</div>

Using **historical weather data** together with location data in a DASH App to answer your question: **How is the expected weather at a particular period of the year in my destination?** 

* [Deploy the App](https://github.com/JAlcocerT/Py_Trip_Planner/tree/main/Deploy)
* Further Description at: 
  * For V1: Historical Weather, with [MeteoStat](https://jalcocert.github.io/JAlcocerT/python-trip-planner/)
  * [For V2](https://github.com/JAlcocerT/Py_Trip_Planner/releases): Historical and [Forecasted Weather](https://jalcocert.github.io/JAlcocerT/python-weather-forecast-with-open-meteo-api/)
  * For V3: Adding AI capabilities - [Chat with Weather Data DF via LangChain](https://jalcocert.github.io/JAlcocerT/using-langchain-with-pandas-df/)


![Trip Planner Graph](./images/trip-planner-main-graph.png)


#### Quick Setup

> [!IMPORTANT]
> Prepare the OPENAI_API key for v3


<details>
  <summary>Using Python Venv...👇</summary>
  &nbsp;


```sh
#sudo apt install python3.12-venv
python3 -m venv trip_planner_venv

#Unix
source trip_planner_venv/bin/activate
#.\trip_planner_venv\Scripts\activate #Windows

pip install -r requirements.txt


source .env
#export OPENAI_API_KEY="your-api-key-here"
#set OPENAI_API_KEY=your-api-key-here
#$env:OPENAI_API_KEY="your-api-key-here"
echo $GROQ_API_KEY $OPENAI_API_KEY $ANTHROPIC_API_KEY

streamlit run Z_ST_AIssistant_v2.py

# git add .
# git commit -m "better st offer analyzer"
# git push
```

</details>

## Powered Thanks To ❤️

* [Dash](https://github.com/plotly/dash)
* [Leaflet](https://github.com/thedirtyfew/dash-leaflet)
* [Meteostat](https://github.com/meteostat)
* [Open-Meteo](https://open-meteo.com/)

> [And more...](https://jalcocert.github.io/JAlcocerT/trip-planner-with-weather/)

## Ways to Contribute 📢

* Please feel free to fork the code - try it out for yourself and improve or add others tabs. The data that is queried give many possibilities to create awsome interactive visualizations.

* Support the Projects that made possible this App, thanks to their fantastic job, this have been possible.

* Support extra evening code sessions:

<div align="center">
  <a href="https://ko-fi.com/Z8Z1QPGUM">
    <img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="ko-fi">
  </a>
</div>


## License 📜

This program is free software; you can redistribute it and/or modify
it under the terms of the **GNU General Public License (GPL) version 3.0**:

Freedom to use: You can use the software for any purpose, without any restrictions.
Freedom to study and modify: You can examine the source code, learn from it, and modify it to suit your needs.
Freedom to share: You can share the original software or your modified versions with others, so they can benefit from it too.
Copyleft: When you distribute the software or any derivative works, you must do so under the same GPL-3.0 license. This ensures that the software and its derivatives remain free and open-source.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY.