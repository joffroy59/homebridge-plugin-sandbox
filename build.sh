#!/bin/sh 

export PLUGIN_FOLDER=$(pwd)

set -x 
npm run build && \
(\
#cd ~/.homebridge/ && \
#npm install $PLUGIN_FOLDER  && \
sudo hb-service restart && \
echo "DONE")
