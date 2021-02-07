class HTTPError extends Error {
    status() {
        return 400;
    }
}

class NotFoundError extends HTTPError {
    status() {
        return 404;
    }
}

class BadRequestError extends HTTPError {}

module.exports = {NotFoundError, BadRequestError, HTTPError};
