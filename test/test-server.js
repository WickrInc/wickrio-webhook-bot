const expect = require('chai').expect;
const request = require('supertest');
const sinon = require('sinon');

const FakeWickr = require('./fakes/wickr');
const Server = require('../lib/server');
const WebhookBot = require('../lib/bot');

describe('server', function() {
    beforeEach(function() {
        this.bot = new WebhookBot(new FakeWickr(), "https://example.com");
        this.bot.receivers = {fakekey123: 'fakevgroup123'};
        this.app = Server(this.bot);
    });

    it('instantiates without issue', function(done) {
        request(this.app).get('/').expect(404, done);
    });

    describe('/send', function() {
        it('responds with a 400 when the `text` param doesnt exist', function(done) {
            request(this.app)
                .post('/send/foo')
                .set('Content-Type', 'application/json')
                .expect(400, done);
        });

        it('responds with a 404 when it receives an unrecognized key', function(done) {
            request(this.app)
                .post('/send/aiosdjfioajsfojawe0f9aj')
                .send({text: "hello world"})
                .set('Content-Type', 'application/json')
                .expect(404, done);
        });

        it('responds with a 200 to JSON requests', function(done) {
            sinon.spy(this.bot, 'send');
            request(this.app)
                .post('/send/fakekey123')
                .send({text: "hello world"})
                .set('Content-Type', 'application/json')
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.text).to.equal('ok');
                    expect(this.bot.send.calledWith(
                        'fakevgroup123', 'hello world'
                    )).to.be.true;
                    return done();
                });
        });

        it('responds with a 200 to form data requests', function(done) {
            sinon.spy(this.bot, 'send');
            request(this.app)
                .post('/send/fakekey123')
                .send('payload={"text":"hello world"}')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.text).to.equal('ok');
                    expect(this.bot.send.calledWith(
                        'fakevgroup123', 'hello world'
                    )).to.be.true;
                    return done();
                });
        });

        it('responds with a 400 to form data requests without payload value', function(done) {
            request(this.app)
                .post('/send/fakekey123')
                .send('foo={"text":"hello world"}')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(400, done);
        });

        it('responds with a 400 to form data requests without text in payload', function(done) {
            request(this.app)
                .post('/send/fakekey123')
                .send('payload={"nottext":"hello world"}')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(400, done);
        });
    });
});