const express = require('express');
const profileRouter = express.Router();
const bcrypt = require('bcrypt');
const userAuth = require('../middlewares/auth.js');

const validateData = require("../utils/validate");

// GET PROFILE
profileRouter.get("/profile",userAuth, async(req,res)=>{

    res.send(req.user);
})
// UPDATE PROFILE

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
    try {
        validateData(req,"editProfile");
        const data = req.body;

        const allowed = ["firstName", "lastName", "age", "gender"];

        const keys = Object.keys(data);

        for (let key of keys) {
            if (!allowed.includes(key)) {
                return res.status(400).send("Update not allowed");
            }
        }

        const user = req.user;

        Object.keys(data).forEach((key) => {
            user[key] = data[key];
        });

        await user.save();

        res.send("Updated successfully");
    }
    catch (err) {
        res.status(400).send(err.message);
    }
});
 
profileRouter.patch("/profile/edit/password",userAuth,async(req,res)=>{
    try{
        validateData(req,"password");
        const {oldPass,newPass} = req.body;
        if(!oldPass || !newPass){
            return res.status(400).send("Both pass required");
        }
        const match = await bcrypt.compare(oldPass, req.user.password);
        if(!match){
            return res.status(400).send("Old password is Incorrect");
        }
        req.user.password = await bcrypt.hash(newPass,10);
        await req.user.save();
        res.send("Password changed successfully");

    }
    catch(err){
        res.status(400).send(err.message);
    }
})


module.exports = profileRouter;