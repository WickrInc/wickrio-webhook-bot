require('dotenv').config();

const express = require('express');
const wickr = require('wickrio_addon');

const WebhookBot = require('./lib/bot');
const {NotFoundError, BadRequestError, HTTPError} = require('./lib/errors');

async function main() {
    const port = process.env.HTTP_PORT || 8080;
    const url = process.env.WEBHOOK_URL;
    if (!url) throw new Error('WEBHOOK_URL value must be set');

    let app = express();
    app.disable('x-powered-by');
    app.use(express.json());
    app.use(express.urlencoded());

    let bot = new WebhookBot(wickr, url);

    app.post('/send/:key', async (req, res) => {
        try {
            let body = req.body;
            if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
                body = JSON.parse(req.body.payload);
            }

            if (!body.text) throw new BadRequestError('Missing text parameter');

            let vgroupid = bot.getVgroupForKey(req.params.key);
            if (!vgroupid) throw new NotFoundError();

            bot.send(vgroupid, body.text);
            res.send("ok");
        } catch (e) {
            if (e instanceof HTTPError) {
                res.status(e.status()).end();
            } else {
                res.status(500).end();
            }
        }
    });

    app.listen(port);
    bot.start();
}

main().then(result => {}).catch(e => { console.error(e); process.exit(1); });
