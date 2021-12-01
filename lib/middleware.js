// formDataParser parses HTTP requests of type application/x-www-form-urlencoded
// by parsing JSON from the `payload` form value. If the `payload` value doesn't
// exist or is not valid JSON, a 400 is returned.
function formDataParser(req, res, next) {
    if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
        try {
            req.body = JSON.parse(req.body.payload);
        } catch {
            res.status(400).end();
        }
    }
    next();
}

// Chime webhooks use the `Content` field instead of `text`
// This middleware just normalizes them by setting body.text to body.Content
// if body.text is not available in the request body.
function chimeParser(req, res, next) {
    if (req.body.text) next();
    if (req.body.Content) req.body.text = req.body.Content;
    next();
}

// attachmentParser handles Slack webhook "attachments" of text format by inlining
// them in the Wickr message
function attachmentParser(req, res, next) {
    if (req.body.attachments) {
        try {
            for (const attachment of req.body.attachments) {
                if (attachment.text) {
                    req.body.text += `\n\n-----\n\n${attachment.text}`;
                }
            }
        } catch (e) {
            console.log("Malformed attachment", e);
        }
    }
    next();
}

module.exports = {formDataParser, chimeParser, attachmentParser};
