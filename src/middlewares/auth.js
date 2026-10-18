
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).send("Please login first");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).send("User not found");
        }

        req.user = user;

        next();
    } catch (err) {
        return res.status(401).send("Invalid or expired token. Please login again.");
    }
};

module.exports = userAuth;
