require("dotenv").config();
const express = require('express');
const app = express();
const validateData = require('./utils/validate');
const connectDB = require('./config/database.js');
const User = require('./models/user.js');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');


app.use(cookieParser());
app.use(express.json())


connectDB().then(()=>{
    console.log("DataBase connection established");
    app.listen(3000,()=>{
    console.log("SERVER STARTED AT 3000");
})
}).catch((err)=>{
    console.log(err);
    console.log("Cant connect to Database");
  
})





app.get("/cukie",async(req,res)=>{

    const token = jwt.sign({id : 12345},"mysecretkey");

    res.cookie("token",token);
    res.send("Cookies sentttt");
})


app.get("/profile",async(req,res)=>{

    try{
    const token = req.cookies.token;
    const decoded = jwt.verify(token,"mysecretkey");
    const user =  await User.findById(decoded.id);
    console.log(decoded);
    res.send(user);
    }
    catch(err){
        res.send("Try Logging again");
    }
})


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


app.delete("/user",async(req,res)=>{
    const id = req.body.id;
    try{
        const user = await User.findByIdAndDelete(id);
        res.send("Deleted");
    }
    catch(err){
        res.status(400).send("Something went wrooooonggggg!!!");
    }
})


app.patch("/update/:emailId",async(req,res)=>{

    

    const data = req.body;
    
    const emailId = req.params.emailId;
    
    const allowed = ["firstName","lastName","password"];

    const keys = Object.keys(data);
    for(let key of keys){
        if(!allowed.includes(key)){
            res.status(400).send("Update not allowed");
        }
    }
    try{
        const user = await User.findOneAndUpdate({emailId :emailId},data);
        res.send("Updated");
    }
    catch(err){
        res.status(400).send("Something went WROOOONG");
    }
})


app.post("/signup",async (req,res)=>{
    try{
        validateData(req);
        req.body.password = await bcrypt.hash(req.body.password,10);
        const user = new User(req.body);
    
        await user.save();
        res.send("Saved to Database");
    }
    catch(err){
        res.status(400).send(err.message);
    }
})


app.post("/login",async (req,res)=>{
    try{
        const {emailId , password} = req.body;
        const user =  await User.findOne({emailId : emailId});
        if(!user){
            throw new Error("Email not registered");
        }
        const pass = await bcrypt.compare(password,user.password);
        if(pass){

            const token = jwt.sign({id: user._id},"mysecretkey");
            res.cookie("token",token);
            
            res.send("Login success");
        }
        else{
            throw new Error("Wrong password");
        }
    }
    catch(err){
        res.status(400).send(err.message);
    }
})


app.use("/",(req,res)=>{
    res.end("HEHE SERVER CHALPEYA");
})