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
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    premiumSince: {
        type: Date,
        default: null
    },
    dailyFeedDate: {
        type: String,
        default: null
    },
    dailyFeedCount: {
        type: Number,
        default: 0
    }
},{
    timestamps : true
})

module.exports = new mongoose.model("User",userSchema);