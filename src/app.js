const express = require('express');

const app = express();

app.use(("/profile"),(req,res)=>{
    res.send("PROFILE KHULGYI");
})

app.use(("/login"),(req,res)=>{
    res.send("LOGIN PAGE KHULGYA");
})

app.use(("/"),(req,res)=>{
    res.send("NODEMON SE CHALAYA SERVER");
})

app.listen(3000,()=>{
    console.log("SERVER STARTED AT 3000");
})