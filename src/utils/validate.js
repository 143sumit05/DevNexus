
const validator = require('validator');

const validateData = (req, type) => {
    const { firstName, emailId, password, oldPass, newPass } = req.body;

    if (type === "signup") {
        if (!firstName || !emailId || !password) {
            throw new Error("First name, email and password are required");
        }

        if (!validator.isEmail(emailId)) {
            throw new Error("Invalid email");
        }

        if (!validator.isStrongPassword(password)) {
            throw new Error("Password is too weak");
        }
    }

    if (type === "login") {
        if (!validator.isEmail(emailId || "")) {
            throw new Error("Invalid email");
        }

        if (typeof password !== "string" || !password) {
            throw new Error("Password is required");
        }
    }

    if (type === "password") {
        if (typeof oldPass !== "string" || !oldPass) {
            throw new Error("Old password is required");
        }

        if (!validator.isStrongPassword(newPass || "")) {
            throw new Error("New password is too weak");
        }
    }

    
    if (type === "editProfile") {
        const allowed = ["firstName", "lastName", "age", "gender"];
        const keys = Object.keys(req.body);

        if (keys.length === 0) {
            throw new Error("Please provide data to update");
        }

        for (let key of keys) {
            if (!allowed.includes(key)) {
                throw new Error("Update not allowed: " + key);
            }
        }

        const { firstName, lastName, age, gender } = req.body;

        if (firstName !== undefined &&
            (typeof firstName !== "string" ||
             firstName.trim().length < 3 ||
             firstName.trim().length > 22)) {
            throw new Error("First name must be 3 to 22 characters");
        }

        if (lastName !== undefined && typeof lastName !== "string") {
            throw new Error("Last name must be a string");
        }

        if (age !== undefined &&
            (!Number.isInteger(age) || age < 18)) {
            throw new Error("Age must be an integer of at least 18");
        }

        if (gender !== undefined && typeof gender !== "string") {
            throw new Error("Gender must be a string");
        }
    }


};

module.exports = validateData;
