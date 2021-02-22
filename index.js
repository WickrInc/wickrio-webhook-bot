require('dotenv').config();

const wickr = require('wickrio_addon');

const WebhookBot = require('./lib/bot');
const Server = require('./lib/server');

async function main() {
    const port = process.env.HTTP_PORT || 8080;
    const url = process.env.WEBHOOK_URL;
    if (!url) throw new Error('WEBHOOK_URL value must be set');

    let bot = new WebhookBot(wickr, url);
    let app = Server(bot);

    app.listen(port);
    bot.start();
}

main().then(result => {}).catch(e => { console.error(e); process.exit(1); });
