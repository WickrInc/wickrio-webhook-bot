const https = require('https')
const SnsValidator = require('sns-validator')

// formDataParser parses HTTP requests of type application/x-www-form-urlencoded
// by parsing JSON from the `payload` form value. If the `payload` value doesn't
// exist or is not valid JSON, a 400 is returned.
function formDataParser(req, res, next) {
  if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
    try {
      req.body = JSON.parse(req.body.payload)
    } catch {
      res.status(400).end()
    }
  }
  next()
}

// Chime webhooks use the `Content` field instead of `text`
// This middleware just normalizes them by setting body.text to body.Content
// if body.text is not available in the request body.
function chimeParser(req, res, next) {
  if (req.body.text) next()
  if (req.body.Content) req.body.text = req.body.Content
  next()
}

// attachmentParser handles Slack webhook "attachments" of text format by inlining
// them in the Wickr message
function attachmentParser(req, res, next) {
  if (req.body.attachments) {
    try {
      for (const attachment of req.body.attachments) {
        if (attachment.text) {
          req.body.text += `\n\n-----\n\n${attachment.text}`
        }
      }
    } catch (e) {
      console.log('Malformed attachment', e)
    }
  }
  next()
}

// snsParser parses messages from AWS Simple Notification Service
// It also handles confirming subscriptions to new SNS Topics
//
// NOTE: This only works with SNS Raw Message delivery disabled
function snsParser(req, res, next) {
  if (!req.get('x-amz-sns-message-type')) next()

  const validator = new SnsValidator()

  validator.validate(req.body, (err, message) => {
    if (err) {
      console.warn('Error validating SNS message:', err)
      res.status(400).end()
    }

    if (message.Type === 'SubscriptionConfirmation') {
      https.get(message.SubscribeURL, () => {
        console.log(`Successfully subscribed to ${message.TopicArn}`)
      })
    }

    // Stop processing the request past this point if it's not a "notification" message
    if (message.Type !== 'Notification') res.end()

    req.body.text = message.Message
    next()
  })
}

module.exports = {formDataParser, chimeParser, attachmentParser, snsParser}
