#!/bin/bash

echo "--------------------------------------------------------------------"
echo "Adding the microservice images in docker daemon security exception..."
echo "--------------------------------------------------------------------"

echo '{
  "insecure-registries" : ["myregistry:5050"]
}
' > /etc/docker/daemon.json

echo "--------------------------------------------------------------------"
echo "Restarting docker service..."
echo "--------------------------------------------------------------------"

service docker restart

echo "--------------------------------------------------------------------"
echo "Pulling Any.JS images.."
echo "--------------------------------------------------------------------"

docker pull lucasurzedo/anyjs:1.0
docker pull lucasurzedo/anyjsobserver:1.0

echo "--------------------------------------------------------------------"
echo "Deploying Any.JS in swarm cluster..."
echo "--------------------------------------------------------------------"

docker stack deploy -c docker-compose.yml anyjs

echo "--------------------------------------------------------------------"
echo "Updating portainer agent microservice in each cluster node..."
echo "--------------------------------------------------------------------"

docker service update --image portainer/agent  anyjs_agent

echo "--------------------------------------------------------------------"
echo "End."
echo "--------------------------------------------------------------------"