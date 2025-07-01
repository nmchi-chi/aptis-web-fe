#!/bin/bash

IMAGE_NAME=aptis-fe
CONTAINER_NAME=aptis-fe-container
PORT=80

docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

docker build -t $IMAGE_NAME .

docker run -d --name $CONTAINER_NAME -p $PORT:80 $IMAGE_NAME

echo "Deployment complete. App is running at http://localhost:$PORT"
