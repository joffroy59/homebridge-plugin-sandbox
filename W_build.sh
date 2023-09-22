#!/bin/sh 

usage()
{
   echo "Add description of the script functions here."
   echo
   echo "Syntax: todo  [-i|h]"
   echo "options:"
   echo "  -i     Install the plugin in homeBridge."
   echo "  -h     Print this Help."
   echo
}

INSTALL_ON=false
# Get the options
while getopts ":hi" option; do
   case $option in
      i) 
        INSTALL_ON=true;;
      h) # display Help
         usage
         exit;;
   esac
done

export PLUGIN_FOLDER=$(pwd)

if [ "$INSTALL_ON" = true ];then
  echo "Installation du plugin On"
fi

set -x 
echo "npm run build" && \
( [ "$INSTALL_ON" = false ] || (cd ~/.homebridge/ && echo "npm install $PLUGIN_FOLDER"))  && \
echo "sudo hb-service restart" && \
echo "DONE"
