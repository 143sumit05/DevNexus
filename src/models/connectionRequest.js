const mongoose = require('mongoose');

const connectionRequestSchema = new mongoose.Schema({
    fromUserId: {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    toUserId: {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        require : true
    },
    status: {
        type: String,
        required : true,
        enum: ["interested","ignored","accepted","rejected"]
    }
    
},{
        timestamps : true
    })

    connectionRequestSchema.index({fromUserId:1,toUserId:1})

    module.exports = mongoose.model("ConnectionRequest",connectionRequestSchema);