#!/bin/bash

echo "--------------------------------------------------------------------"
cat << "EOF"
                                          
                 mm                          mmm   mmmm 
                 ##   m mm   m   m             #  #"   "
                #  #  #"  #  "m m"             #  "#mmm 
                #mm#  #   #   #m#              #      "#
               #    # #   #   "#      #    "mmm"  "mmm#"
                              m"                        
                             ""                         
EOF
echo "                  a distributed general purpose computing middleware"
echo "--------------------------------------------------------------------"

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
