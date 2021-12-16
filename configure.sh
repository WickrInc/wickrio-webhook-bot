#!/bin/bash

# Set the default values
HTTP_PORT=8080
WEBHOOK_URL="https://hooks.example.com"

# A file of pre-defined vars can be passed as the first argument to this script
if [[ -n "$1" && -r "$1" ]]; then
    . "$1"
    cp "$1" .env
elif [[ -f ".env" ]]; then
    . .env
fi

echo "prompt: Select a port for the bot HTTP server [$HTTP_PORT]"
read PORT
if [[ -z "$PORT" ]]; then
    PORT=$HTTP_PORT
fi

grep -q "HTTP_PORT" .env
if [[ $? -eq 0 ]]; then
    sed -i "/^HTTP_PORT=/c\HTTP_PORT=$PORT" .env
else
    echo "HTTP_PORT=$PORT" >> .env
fi

echo "prompt: Enter the frontend URL for your webhook receiver [$WEBHOOK_URL]"
read URL
if [[ -z "$URL" ]]; then
    URL=$WEBHOOK_URL
fi

grep -q "WEBHOOK_URL" .env
if [[ $? -eq 0 ]]; then
    sed -i "/^WEBHOOK_URL=/c\WEBHOOK_URL=$URL" .env
else
    echo "WEBHOOK_URL=$URL" >> .env
fi

