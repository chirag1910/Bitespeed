/**
 * Middleware to validate the request body for the identify endpoint
 */
const validateIdentify = (req, res, next) => {
    if (!req.body) {
        return res.status(400).json({ error: "Request body is missing." });
    }

    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
        return res.status(400).json({
            error: "At least one of email or phoneNumber must be provided.",
        });
    }

    next();
};

module.exports = { validateIdentify };
