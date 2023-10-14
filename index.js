const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const { ALL } = require('dns');
const mongoose =require('mongoose')
const RoomModel = require("./modals/rooms")

mongoose.connect('mongodb+srv://custom_tan:varun_123@cluster0.epypnho.mongodb.net/Chat_DB?retryWrites=true&w=majority')
    .then((res)=>{
        console.log("Data base connection successful..");
    })
    .catch((err)=>{
        console.log("Data base connection failed :=> ",err);
    })

app.use(cors());

const server = http.createServer(app)
const socket = new Server(server, {
    cors: {
        origin: ALL,
        methods: ["GET", "POST"]
    }
})

socket.on("connection", (socket) => {
    console.log(`USER CONNECTED - ${socket.id}`);

    socket.on("send_message",(data)=>{
        socket.join(data.room)
        console.log(`User with id : ${socket.id} joined room : ${data.room} with name : ${data.auther}`)
        socket.to(data.room).emit("recive_message",data)
        HandleNewMessages(data)
    })
    socket.on("join_room", (data) => {
        socket.join(data.room)
        CreateRoom(data)
        console.log(`User with id : ${socket.id} joined room : ${data.room} with name : ${data.username}`)
    });

    socket.on("disconnect", () => {
        console.log(`${socket.id} is disconnected.`);
    });
});

const CreateRoom = (data) =>{
    const room = data.room;
    const Data = {
        'room' : room,
        'Data' : []
    }
    RoomModel.findOne({ 'room':room })
        .then((res) => {
            if (res === null) {
                console.log('New room');
                RoomModel.create(Data)
                    .then((res)=>{
                        console.log("Room created : ",room)
                    })
                    .catch((err)=>{
                        console.log("Error occured.. {;'}")
                    })
            } else {
                console.log('Room already exists');
            }
        })
        .catch((error) => {
            console.error('Error while querying the database:', error);
        });
}
const HandleNewMessages = (Data) => {
    const room = Data.room;
    const MySchema = {
            'auther' : Data.auther,
            'message':Data.message,
            'time': Data.time
             }

    RoomModel.findOneAndUpdate(
        {'room':room},
        { $push : { Data : MySchema}},
        {new : true}
    )
        .then((res) => {
            if (res) {
                console.log('Message Added');
            } else {
                console.log('Something went wrong');
                console.log(res)
            }
        })
        .catch((error) => {
            console.error('Error while querying the database:', error);
        });
}


app.get('/',(req,res)=>{
    res.status(200).json({'message':'online'})
})
app.get('/get_old_messages',(req,res)=>{
    console.log(req.query);
    data = req.query;
    room = data.roomID;
    RoomModel.findOne({'room':room})
        .then((res_)=>{
            if(res_!==null){
                console.log(res_.Data)
                const data = res_.Data;
                res.status(200).json({'message':'old room',data})
            }
            else{
                console.log("200")
                res.status(200).json({'message':'new room'})
            }
        })
        .catch((err)=>{
            console.log("500")
            res.status(500).json({'message':'ERROR'})
        })
})

server.listen(10209, () => {
    console.log("Server running on port 10209...")
})
