# Use the official lightweight Python image.
# https://hub.docker.com/_/python
FROM python:3.8

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
#docker build -t reisikei/pytripplanner .
#docker login
#docker push reisikei/pytripplanner