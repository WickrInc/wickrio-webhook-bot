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
    app.use(express.json());

    let bot = new WebhookBot(wickr, url);

    app.post('/send/:key', async (req, res) => {
        try {
            let msg = req.body.text;
            if (!msg) throw new BadRequestError('Missing text parameter');

            let vgroupid = bot.getVgroupForKey(req.params.key);
            if (!vgroupid) throw new NotFoundError();

            bot.send(vgroupid, msg);
            res.send("ok");
        } catch (e) {
            if (e instanceof HTTPError) {
                res.status(e.status()).end(e);
            } else {
                res.status(500).end(e);
            }
        }
    });

    app.listen(port);
    bot.start();
}

main().then(result => {}).catch(e => { console.error(e); process.exit(1); });
