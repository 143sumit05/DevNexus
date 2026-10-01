const validator = require('validator');

const validateData = (req)=>{
    const {password} = req.body;
    if(!validator.isStrongPassword(password)){
        throw new Error("Password is Weakkasss!!!");
    }
}
module.exports = validateData;