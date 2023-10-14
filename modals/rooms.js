const mongoose = require('mongoose');


const roomSchema = new mongoose.Schema({
    room: {
        type : String,
        required : true,
        unique : true 
    },
    Data: [
        {
        auther: String,
        message: String, 
        time: String
        }
    ]
});

const RoomModel = mongoose.model('rooms', roomSchema);

module.exports = RoomModel;