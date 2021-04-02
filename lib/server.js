const express = require('express');
const morgan = require('morgan');
const {NotFoundError, BadRequestError, HTTPError} = require('./errors');

module.exports = function createServer(bot) {
    let app = express();

    // disable stack traces and x-powered-by header
    app.set('env', 'production');
    app.disable('x-powered-by');

    app.use(morgan('combined'));
    app.use(express.json({type: ["application/json", "text/plain"]}));
    app.use(express.urlencoded({extended: false}));

    app.get('/healthz', (req, res) => res.status(200).end());

    app.post('/send/:key', async (req, res) => {
        try {
            let body = req.body;
            if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
                try {
                    body = JSON.parse(req.body.payload);
                } catch {
                    throw new BadRequestError();
                }
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

    return app;
};
