require("dotenv").config();
const express = require('express');
const app = express();

const connectDB = require('./config/database.js');
const User = require('./models/user.js');


connectDB().then(()=>{
    console.log("DataBase connection established");
    app.listen(3000,()=>{
    console.log("SERVER STARTED AT 3000");
})
}).catch((err)=>{
    console.log("Cant connect to Database");
})
app.post("/signup",async (req,res)=>{
    const user = new User({
        firstName : "Shivani",
        lastName : "Modi",
        emailId : "143shivani05@gmail.com",
        password : "shivani123",
        age : 20,
        gender : "female"
    })
    await user.save();
    res.send("Saved to Database");
})
app.use("/",(req,res)=>{
    res.end("HEHE SERVER CHALPEYA");
})