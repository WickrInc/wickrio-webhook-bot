const expect = require('chai').expect;
const sinon = require('sinon');

const FakeWickr = require('./fakes/wickr');
const WebhookBot = require('../lib/bot');

describe('bot', function() {
    beforeEach(function() {
        this.bot = new WebhookBot(new FakeWickr(), "https://example.com");
    });

    it('instantiates without issue', function() {
        let wickr = new FakeWickr();
        let bot = new WebhookBot(wickr);
    });

    it('registers handlers', function() {
        expect(Object.keys(this.bot.handlers)).to.eql(["help", "show", "rekey"]);
    });

    describe('#send', function() {
        it('trims really long messages', function() {
            const wickr = new FakeWickr();
            const bot = new WebhookBot(wickr);
            sinon.spy(wickr, 'cmdSendRoomMessage');

            const tooLong = 'A'.repeat(11111);
            const expected = 'A'.repeat(9997) + '...';

            bot.send('Vfoo', tooLong);
            expect(wickr.cmdSendRoomMessage.getCall(0).args[1]).to.equal(expected);
        });
    });

    describe('#getURL', function() {
        it('generates URLs correctly', function() {
            expect(this.bot.getURL('fakekey123')).to.equal("https://example.com/send/fakekey123");
        });

        it('does not generate URLs with a double slash if the URL ends with /', function() {
            let bot = new WebhookBot(new FakeWickr(), "http://example.com/");
            expect(bot.getURL('fakekey123')).to.equal("http://example.com/send/fakekey123");
        });
    });

    describe('#getKeyForVgroup', function() {
        it('returns undefined when there is no key for a vgroup', function() {
            expect(this.bot.getKeyForVgroup('Vfoo')).to.be.undefined;
        });

        it('returns the correct key', function() {
            this.bot.receivers = {lolwut: {vgroupid: 'Vfoo'}};
            expect(this.bot.getKeyForVgroup('Vfoo')).to.equal('lolwut');
        });
    });

    describe('#_create', function() {
        it('generates a new key for a vgroup', function() {
            let key = this.bot._create('Vfoo');
            expect(key).to.not.be.null;
            expect(key).to.have.lengthOf(32);
            expect(this.bot.receivers[key].vgroupid).to.equal('Vfoo');
        });
    });

    describe('#_rekey', function() {
        it('generates a new key for a vgroup with an existing key', function() {
            this.bot.receivers['oldkey'] = {vgroupid: 'Vfoo'};
            let key = this.bot._rekey('oldkey', 'Vfoo');

            expect(key).to.not.be.null;
            expect(key).to.have.lengthOf(32);
            expect(this.bot.receivers[key].vgroupid).to.equal('Vfoo');
            expect(this.bot.receivers['oldkey']).to.be.undefined;
        });
    });

    describe('#getVgroupForKey', function() {
        it('finds the vgroup for the provided webhook key', function() {
            this.bot.receivers['foo'] = {vgroupid: 'Vfoo'};
            expect(this.bot.getVgroupForKey('foo')).to.equal('Vfoo');
        });

        it('returns undefined when no key is found', function() {
            expect(this.bot.getVgroupForKey('foo')).to.be.undefined;
        });
    });

    describe('#rekey', function() {
        it('detects when a key does not exist already', function() {
            sinon.spy(this.bot, 'send');
            this.bot.rekey({vgroupid: 'Vfoo'});

            expect(this.bot.send.calledWith(
                'Vfoo', 'No webhook key found for this room. Creating a new one.'
            )).to.be.true;

            // We send another message when the key is created in `create`
            expect(this.bot.send.calledTwice).to.be.true;
        });

        it('sends a warning message first', function() {
            this.bot.receivers['fakekey'] = {vgroupid: 'Vfoo'};
            sinon.spy(this.bot, 'send');

            this.bot.rekey({vgroupid: 'Vfoo'}, []);
            let sendArgs = this.bot.send.getCall(0).args;

            expect(sendArgs[0]).to.equal('Vfoo');
            expect(sendArgs[1]).to.match(/This operation will update the webhook URL for this room./);
            expect(this.bot.send.calledOnce).to.be.true;
        });

        it('updates an existing key', function() {
            this.bot.receivers['fakekey'] = {vgroupid: 'Vfoo'};
            sinon.spy(this.bot, 'send');

            let result = this.bot.rekey({vgroupid: 'Vfoo'}, ['fakekey']);
            let sendArgs = this.bot.send.getCall(0).args;

            expect(sendArgs[0]).to.equal('Vfoo');
            expect(sendArgs[1]).to.match(/The new webhook receiver for this room is/);
            expect(this.bot.send.calledOnce).to.be.true;

            expect(this.bot.receivers.fakekey).to.be.undefined;
            expect(this.bot.receivers[result].vgroupid).to.equal('Vfoo');
        });

        it('does not update a key if room to rekey is not the current room', function() {
            this.bot.receivers = { fakekey: {vgroupid: 'Vbar'}, fakekey2: {vgroupid: 'Vfoo'} };
            sinon.spy(this.bot, 'send');

            let result = this.bot.rekey({vgroupid: 'Vfoo'}, ['fakekey']);
            let sendArgs = this.bot.send.getCall(0).args;

            expect(result).to.be.undefined;
            expect(this.bot.receivers.fakekey.vgroupid).to.equal('Vbar');

            expect(sendArgs[0]).to.equal('Vfoo');
            expect(sendArgs[1]).to.match(/Error: invalid webhook key/);
            expect(this.bot.send.calledOnce).to.be.true;
        });
    });
});
