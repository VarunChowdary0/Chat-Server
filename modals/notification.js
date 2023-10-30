const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
    username : {
        type : String,
        required : true,
        unique : true
    },
    Data : [
        {
            room : {
                type : String,
                required : true
            },
            length : {
                type : Number,
                required : true,
            }
        }
    ]
})

const NotificationModel = new mongoose.model('notifications',notificationSchema);

module.exports = NotificationModel;