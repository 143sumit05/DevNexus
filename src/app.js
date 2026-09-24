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
    console.log(err);
    console.log("Cant connect to Database");
  
})
app.use(express.json())

// app.get("/userEmail",async(req,res)=>{
//     const users = req.body.emailId;
//     try{
//         const user = await User.find({})
//         res.send(user);
//     }
//     catch(err){
//         res.status(400).send("Something went wrong");
//     }
// })
app.get("/feed",async(req,res)=>{
    const users = req.body.emailId;
    try{
        const user = await User.find({})
        res.send(user);
    }
    catch(err){
        res.status(400).send("Something went wrong");
    }
})



// app.post("/signup",async (req,res)=>{
//     const user = new User(req.body);
//     console.log(req.body)
//     await user.save();
//     res.send("Saved to Database");
// })
app.use("/",(req,res)=>{
    res.end("HEHE SERVER CHALPEYA");
})