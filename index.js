const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const { ALL } = require('dns');
const mongoose =require('mongoose')
const RoomModel = require("./modals/rooms")
const UserModel = require("./modals/user") 
const MyRoomsModel = require("./modals/userRooms");
const { userInfo } = require('os');

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
               // console.log(res)
            }
        })
        .catch((error) => {
            console.error('Error while querying the database:', error);
        });
}


app.get('/',(req,res)=>{
    res.status(200).json({'message':'online'})
})

app.get('/signup',(req,res)=>{
    data= req.query;
    console.log(data)
    UserModel.create(data)
        .then((resi)=>{
            if(MyRooms(data.username)){
                res.status(200).json({'message':'CREATED'})
            }
            res.status(200).json({'message':'CREATED'})
        })
        .catch((err)=>{
            console.log("error: ",err)
            res.status(400).json({'message':'DUPLICATE'})
        })
})
app.get('/login',(req,res)=>{
    data= req.query;
    UserModel.findOne({'username':data.username,
                        'password':data.password})
        .then((responce)=>{
            if(responce===null){
                console.log("No user matched")
                res.status(404).json({'message':'Invalied'})
            }
            else{
                res.status(200).json({'message':'OK'})
            }
        })
        .catch((err)=>{
            res.status(500).json({'message':'SERVER ISSUE'})
        })
})

const MyRooms = (username)=>{
    console.log('called')
    MyRoomsModel.create({'username':username,Data:[]})
        .then((responce)=>{
            console.log(("Ok"))
            return true
        })
        .catch((err)=>{
            console.log("Not ok",err)
            return 'No'
        })
}

app.get('/get_all_rooms', (req, res) => {
    const username = req.query.username;
    MyRoomsModel.findOne({'username':username})
        .then((resp)=>{
            res.status(200).json({'message':'OK','Data':resp['Data']})
        })
        .catch((err)=>{
            res.status(404).json({'message':'Something went wrong'})
            console.log((err))
        })
});


app.get('/get_old_messages',(req,res)=>{
    data = req.query;
    room = data.roomID;
    RoomModel.findOne({'room':room})
        .then((res_)=>{
            if(res_!==null){
                //console.log(res_.Data)
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

app.get('/Add_a_room',(req,res)=>{
    data = req.query;
    console.log(data)
    MyRoomsModel.findOneAndUpdate(
        {'username':data.username},
        { $addToSet  : { Data : data.room}},
        {new : true}
    )
        .then((resp) => {
            if (resp) {
                console.log('Room Added');
                res.status(200).json({'message':'ROOM ADDED'})
            } else {
                console.log('Something went wrong');
                res.status(500).json({'message':'ROOM FAILED'})
            }
        })
        .catch((error) => {
            console.error('Error while querying the database:', error);
        });
})

server.listen(10209, () => {
    console.log("Server running on port 10209...")
})
