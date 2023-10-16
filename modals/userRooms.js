const mongoose = require('mongoose');


const MyRoomsSchema = new mongoose.Schema({
    username: {
        type : String,
        required : true,
        unique : true 
    },
    Data: {
        type: [String], // Assuming elements are strings
        default: [],
        validate: {
            validator: function (value) {
                // Use a Set to check for uniqueness
                const uniqueElements = new Set(value);
                return uniqueElements.size === value.length;
            },
            message: "Elements in 'Data' must be unique."
        }
    }
});

const MyRoomsModel = mongoose.model('myRooms', MyRoomsSchema);
module.exports = MyRoomsModel;