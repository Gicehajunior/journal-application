class Exceptions extends Error {
    constructor(status, code, message, reason = null) {
        super(message);
        this.status = status;
        this.code = code;
        this.reason = reason;
    }
}

module.exports = Exceptions;