const express = require('express');

const app = express();
// app.get("/profile",(req,res)=>{
//     res.send("PROFILE KHULGYI");
// })
// app.post(("/profile"),(req,res)=>{
//     res.send("SuccesFully Posted data");
// })
// app.use(("/login"),(req,res)=>{
//     res.send("LOGIN PAGE KHULGYA");
// })

// app.use(("/"),(req,res)=>{
//     res.send("NODEMON SE CHALAYA SERVER");
// })

app.use("/user",(req,res,next)=>{
    console.log("1");
    next();
    // res.end("RES1");
 
},[(req,res,next)=>{
    console.log("2");
    next();
    
}],(req,res,next)=>{
    console.log(3);
    res.end("3");
})




app.listen(3000,()=>{
    console.log("SERVER STARTED AT 3000");
})