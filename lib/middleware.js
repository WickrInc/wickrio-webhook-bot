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

module.exports = {formDataParser};
