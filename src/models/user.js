const mongoose = require('mongoose');
const validator = require('validator');
const userSchema = mongoose.Schema({
    firstName : {
        type: String,
        required : true,
        minlength : 3,
        maxlength : 22 
    },
    lastName: {
        type: String
    },
    emailId: {
        type: String,
        required : true,
        lowercase : true,
        trim : true,
        unique : true,
        validate : validator.isEmail
    },
    password: {
        required : true,
        type: String,
    },
    age: {
        type : Number,
        min : 18
    },
    gender: {
        type : String
    }
},{
    timestamps : true
})

module.exports = new mongoose.model("User",userSchema);