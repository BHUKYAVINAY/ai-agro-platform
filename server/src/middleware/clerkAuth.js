
const { getAuth } = require("@clerk/express");

const requireClerkAuth = (req, res, next) => {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please sign in first."
            });
        }

        req.userId = userId;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = requireClerkAuth;
