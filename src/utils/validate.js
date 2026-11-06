
const validator = require('validator');

const validateData = (req, type) => {
    const { firstName, emailId, password, oldPass, newPass } = req.body;

    // SIGNUP VALIDATION
    if (type === "signup") {
        const allowed = [
            "firstName", "lastName", "emailId",
            "password", "age", "gender"
        ];

        for (let key of Object.keys(req.body)) {
            if (!allowed.includes(key)) {
                throw new Error("Invalid field: " + key);
            }
        }

        if (typeof firstName !== "string" || !firstName.trim()) {
            throw new Error("First name is required");
        }

        if (typeof emailId !== "string" || !validator.isEmail(emailId)) {
            throw new Error("Invalid email");
        }

        if (typeof password !== "string" || !validator.isStrongPassword(password)) {
            throw new Error("Password is too weak");
        }

        if (firstName.trim().length < 3 || firstName.trim().length > 22) {
            throw new Error("First name must be 3 to 22 characters");
        }

        if (req.body.lastName !== undefined &&
            typeof req.body.lastName !== "string") {
            throw new Error("Last name must be a string");
        }

        if (req.body.age !== undefined &&
            (!Number.isInteger(req.body.age) || req.body.age < 18)) {
            throw new Error("Age must be an integer of at least 18");
        }

        if (req.body.gender !== undefined &&
            typeof req.body.gender !== "string") {
            throw new Error("Gender must be a string");
        }

        req.body.firstName = firstName.trim();
        if (typeof req.body.lastName === "string") {
            req.body.lastName = req.body.lastName.trim();
        }
    }

    // LOGIN VALIDATION
    if (type === "login") {
        if (typeof emailId !== "string" || !validator.isEmail(emailId)) {
            throw new Error("Invalid email");
        }

        if (typeof password !== "string" || !password) {
            throw new Error("Password is required");
        }
    }

    // PASSWORD CHANGE VALIDATION
    if (type === "password") {
        if (typeof oldPass !== "string" || !oldPass) {
            throw new Error("Old password is required");
        }

        if (typeof newPass !== "string" ||
            !validator.isStrongPassword(newPass)) {
            throw new Error("New password is too weak");
        }
    }

    // PROFILE EDIT VALIDATION
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

        if (firstName !== undefined) {
            if (typeof firstName !== "string" ||
                firstName.trim().length < 3 ||
                firstName.trim().length > 22) {
                throw new Error("First name must be 3 to 22 characters");
            }
            req.body.firstName = firstName.trim();
        }

        if (lastName !== undefined) {
            if (typeof lastName !== "string") {
                throw new Error("Last name must be a string");
            }
            req.body.lastName = lastName.trim();
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
