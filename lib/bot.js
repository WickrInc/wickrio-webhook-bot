const base62 = require('base62-random');
const WickrBot = require('wickrbot');

const DEFAULT_KEY_LENGTH = 32;

class WebhookBot extends WickrBot {
    constructor(wickr, url) {
        super(wickr);
        this.url = url;
        this.statePath = "webhookbot/state";
        this.receivers = {};

        this.helpText = "The Webhook bot provides a simple way to post messages from other apps into this room " +
                        "using incoming webhooks.";
        this.listen('create', this.create.bind(this), {description: "Show the webhook URL for this room"});
        this.listen('rekey', this.rekey.bind(this), {description: "Generate a new webhook URL for this room"});

        this.on('start', () => { this.loadState() });
    }

    create(msg, args) {
        let key = this.getKeyForVgroup(msg.vgroupid);
        if (!key) {
            key = this._create(msg.vgroupid);
        }
        this.send(msg.vgroupid, `The webhook receiver for this room is ${this.getURL(key)}`);
    }

    rekey(msg, args) {
        let currentKey = this.getKeyForVgroup(msg.vgroupid);

        if (!currentKey) {
            this.send(msg.vgroupid, 'No webhook key found for this room. Creating a new one.');
            this.create(msg, args);
            return;
        }

        if (!args) {
            this.send(
                msg.vgroupid,
                '⚠️⚠️⚠️\n' + 'This operation will update the webhook URL for this room. ' +
                'All existing integrations which use the current URL will need to be updated. ' +
                'To proceed with generating a new webhook URL, send the following command:\n\n' +
                `/rekey ${currentKey}`
            );
            return;
        }

        // Check that the key provided by the user exists and is assigned to this room
        try {
            if (this.getVgroupForKey(args[0]) !== msg.vgroupid) throw new Error();
        } catch (e) {
            this.send(msg.vgroupid, 'Error: invalid webhook key');
            return;
        }

        let key = this._rekey(currentKey, msg.vgroupid);
        this.send(msg.vgroupid, `The new webhook receiver for this room is ${this.getURL(key)}`);

        return key;
    }

    // getVgroupForKey returns the vgroupid associated with a webhook key
    getVgroupForKey(key) {
        return this.receivers[key];
    }

    // getKeyForVgroup looks up the webhook key for a vgroup
    getKeyForVgroup(vgroupid) {
        for (let key in this.receivers) {
            if (this.receivers[key] === vgroupid) return key;
        }
    }

    // _create generates a new webhook key for vgroupid
    _create(vgroupid, keyLength=DEFAULT_KEY_LENGTH) {
        let key = base62(keyLength);
        this.receivers[key] = vgroupid;
        this.saveState();
        return key;
    }

    _rekey(oldKey, vgroupid) {
        delete this.receivers[oldKey];
        return this._create(vgroupid);
    }

    // getURL returns the webhook URL for a given key
    getURL(key) {
        return `${this.url}${this.url.endsWith('/') ? '' : '/'}send/${key}`;
    }

    loadState() {
        try {
            let data = this.brain.get(this.statePath);
            if (data) {
                this.receivers = JSON.parse(data) || {};
            }
        } catch (e) {
            console.error("Error loading saved state:", e);
        }
    }

    saveState() {
        this.brain.set(this.statePath, JSON.stringify(this.receivers));
    }
}

module.exports = WebhookBot;
