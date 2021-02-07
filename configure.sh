#!/bin/bash

# A file of pre-defined vars can be passed as the first argument to this script
if [[ -n "$1" && -r "$1" ]]; then
    . "$1"
    cp "$1" .env
fi

if [[ -z "$HTTP_PORT" ]]; then
    echo 'prompt: Select a port for the bot HTTP server [8080]'
    read PORT
    PORT=${PORT:-8080}
    echo "HTTP_PORT=$PORT" >> .env
fi

if [[ -z "$WEBHOOK_URL" ]]; then
    echo 'prompt: Enter the frontend URL for your webhook receiver (e.g. https://hooks.example.com)'
    read WEBHOOK_URL
    echo "WEBHOOK_URL=$WEBHOOK_URL" >> .env
fi
