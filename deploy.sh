#!/bin/bash

# Variables
SERVER="opc@146.235.225.150"
KEY_FILE="oracle-private.key"
REMOTE_DIR="/home/opc/ai-arsenal"

# Create deployment directory on server
ssh -i $KEY_FILE $SERVER "mkdir -p $REMOTE_DIR"

# Copy necessary files
scp -i $KEY_FILE docker-compose.yml $SERVER:$REMOTE_DIR/
scp -i $KEY_FILE .env $SERVER:$REMOTE_DIR/

# Setup and start Docker containers
ssh -i $KEY_FILE $SERVER "cd $REMOTE_DIR && \
  sudo docker-compose pull && \
  sudo docker-compose up -d"

echo "Deployment completed! Meilisearch should be running on port 7700" 