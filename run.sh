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

sudo mkdir /mnt/data
docker stack deploy -c docker-compose.yaml anyjs
docker service update anyjs_server --force

echo "--------------------------------------------------------------------"
echo "End."
echo "--------------------------------------------------------------------"
