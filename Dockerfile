# https://hub.docker.com/_/python
FROM python:3.11   
# 3.8
LABEL org.opencontainers.image.source=https://github.com/JAlcocerT/Py_Trip_Planner
LABEL org.opencontainers.image.description="Python Trip Planner with Weather"
LABEL org.opencontainers.image.licenses=GPL-3.0
LABEL maintainer="JAlcocerT"

# Copy local code to the container image.
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY . ./

#COPY ./app ./ 
#source-destination

# Install production dependencies.
RUN pip install -r requirements.txt

EXPOSE 8050

CMD python ./app/app.py 
#CMD python app.py --bind :$PORT --workers 1 --threads 8 --timeout 0 main:app


#Building from local files:
#docker build -t pytripplanner .
#docker image ls #to check the images locally

#Running the container:
#docker run -p 8050:8050 pytripplanner
#docker run --name PyTripPlanner -p 8050:8050 pytripplanner -d

#Pushing the image to the registry:

##dockerhub
#docker build -t jalcocert/pytripplanner .
#docker login
#docker push jalcocert/pytripplanner