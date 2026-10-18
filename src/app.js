require("dotenv").config();
const express = require('express');
const app = express();
const validateData = require('./utils/validate');
const connectDB = require('./config/database.js');
const User = require('./models/user.js');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const authRouter = require('./routes/authRouter.js');
const profileRouter = require('./routes/profileRouter.js');
const requestRouter = require('./routes/requestRouter.js');
const userRouter = require('./routes/userRoute.js');
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



app.use("/",authRouter);
app.use("/",profileRouter);
app.use("/",requestRouter);
app.use("/",userRouter);

app.get("/cukie",async(req,res)=>{

    const token = jwt.sign({id : 12345},"mysecretkey");

    res.cookie("token",token);
    res.send("Cookies sentttt");
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





app.use("/",(req,res)=>{
    res.end("HEHE SERVER CHALPEYA");
})