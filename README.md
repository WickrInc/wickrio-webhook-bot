# Wickr Webhook Bot

This project is a WickrIO integration created via [cookiecutter-wickr-bot](https://github.com/WickrInc/cookiecutter-wickr-bot)

## Installation

See the WickrIO [Getting Started Guide](https://wickrinc.github.io/wickrio-docs/#wickr-io-getting-started).

## Usage

Webhook Bot understands the following commands:

 - `/help` - Prints a help message with all available commands
 - `/create` - Output the webhook URL for the current room
 - `/rekey` - Rotate the current webhook URL for the room

### Sending a webhook message

The API is almost identical to the [Slack Incoming Webhooks API](https://api.slack.com/messaging/webhooks#posting_with_webhooks).

``` bash
curl https://hooks.example.com/send/$KEY -d 'payload={"text": "hello world"}'
# or
curl https://hooks.example.com/send/$KEY -H "Content-type: application/json" -d '{"text": "hello world"}'
```

## Development

### Building

Run `make` to create a new `software.tar.gz` package, which can be installed as a WickrIO Custom Integration. See the [WickrIO docs](https://wickrinc.github.io/wickrio-docs/#developing-integrations-creating-an-integration-locally) for more details.
