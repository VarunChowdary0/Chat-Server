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
const NotificationModel = require("./modals/notification")
const { userInfo } = require('os');
const helmet = require('helmet')


mongoose.connect('mongodb+srv://custom_tan:varun_123@cluster0.epypnho.mongodb.net/Chat_DB?retryWrites=true&w=majority')
    .then((res)=>{
        console.log("Data base connection successful..");
    })
    .catch((err)=>{
        console.log("Data base connection failed :=> ",err);
    })

app.use(cors());
app.use(helmet());

let count = 0;
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
        socket.join(data.room.trim())
        console.log(`User with id : ${socket.id} joined room : ${data.room} with name : ${data.auther}`)
        socket.to(data.room.trim()).emit("recive_message",data)
        HandleNewMessages(data)
    })
    socket.on("join_room", (data) => {
        socket.join(data.room.trim())
        CreateRoom(data)
        console.log(`User with id : ${socket.id} joined room : ${data.room} with name : ${data.username}`)
    });

    socket.on('disconnect',()=>{
        socket.broadcast.emit('callended')
        console.log("Disconnected: ",socket.id)
    });

    socket.on('CallUser', ({ usersIDtoCall, signalData, whoIsCaling_ID, NameOfCaller }) => {
        console.log("Call user",NameOfCaller,usersIDtoCall,whoIsCaling_ID)
        socket.to(usersIDtoCall).emit('CallUser', { signal: signalData, whoIsCaling_ID, NameOfCaller });
    });
    

    socket.on('AnswerCall',(data)=>{
        socket.to(data.to).emit("callaccepted",data.signal)
    });

});

const CreateRoom = (data) =>{
    const room = data.room;
    console.log('Function - CreateRoom  ')
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
    console.log('Function - HandleNewMessages  ')

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

const CreateNotificationBox = (username) =>{
    let daa ;
    console.log('Function - CreateNotificationBox  ')
    MyRoomsModel.findOne({'username':username})
    .then((resp)=>{
        daa = resp['Data'];
        Lens(daa,username)
    })
    .catch((err)=>{
        console.log((err))
    })
}

const Lens = (data,username) => {
    console.log('Function - Lens ')
    const promises = data.map((ele, ind) => {
        return RoomModel.findOne({ 'room': ele })
            .then((resp) => {
                if (resp) {
                  //  console.log(`room : ${ele}  , length: ${resp['Data'].length}`);
                    return { 'room': ele, 'length': resp['Data'].length };
                } else {
                    console.log('Not found');
                    return { 'room': ele, 'length': 0 }; // Assuming you want to return 0 if not found
                }
            })
            .catch((error) => {
                console.error('Error:', error);
                return { 'room': ele, 'length': 0 }; // Handle the error and return 0
            });
    });

    Promise.all(promises)
        .then((results) => {
            const Data = {
                'username':username,
                'info':results
            }
            //console.log(Data)
            Appender(Data);
        });
    
}



const Appender = (data) => {
    const username = data['username']
    const Info = data['info'];
    console.log('Function - Appender ')

    NotificationModel.findOneAndUpdate(
        { 'username': username },
        { 'Data': Info },
        { upsert: true, new: true } // Use upsert to update or insert
    )
    .then((resp) => {
        //console.log('Updated or Inserted:', resp);
    })
    .catch((err) => {
        console.error('Error:', err);
    });
}


app.get('/',(req,res)=>{
    count+=1;
    const username = req.query['username']
    console.log('get - Online Status -/ ->',count)
    CreateNotificationBox(username)
    res.status(200).json({'message':'online'})
})

app.get('/signup',(req,res)=>{
    count+=1;
    data= req.query;
    console.log('get - Signup -/signup ->',count)
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
    count+=1;
    data= req.query;
    console.log('get - Login -/login ->',count)
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
    console.log('Function - Create a user  ')
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
    count+=1;
    const username = req.query.username;
    console.log('get - All_rooms_of_user -/get_all_rooms ->',count)
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
    count+=1;
    data = req.query;
    room = data.roomID;
    console.log('get - Old_messages -/get_old_messages ->',count)
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
    count+=1;
    data = req.query;
    console.log('get - Add a room -/Add_a_room ->',count)
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

app.get('/get_length_of_rooms',(req,res)=>{
    const username = req.query.username;
    count+=1;
    //console.log(room['room'])
    //console.log(username);
    console.log('get - all_rooms_length -/get_length_of_rooms ->',count)
    NotificationModel.findOne({'username':username})
        .then((resp)=>{
            if(resp){
                res.status(200).json(resp['Data']);
            }
            else{
                console.log('Not found');
                res.status(404).json('N A');
            }
        })
})

app.get('/get_length_of_room',(req,res)=>{
    count+=1;
    const room = req.query;
    console.log('get - single_room_length -/get_length_of_room ->',count)
    RoomModel.findOne(room)
        .then((resp)=>{
            console.log('len')
            if(resp){
                res.status(200).json({"length":resp['Data'].length});
            }
            else{
                console.log('Not found');
                res.status(404).json({'length':0});
            }
        })
})


app.get('/delete_one_message',(req,res)=>{
    count+=1;
    const room = req.query.roomID;
    const _id = req.query.message_ID;

    RoomModel.findOneAndUpdate(
        { "room": room, 'Data._id': _id }, 
        { $set: { 'Data.$.message': "--DELETED--" } }, 
        { new: true } 
      )
        .then(updatedRoom => {
          if (!updatedRoom) {
            res.status(404).json({'message':'NOT FOUND'})
            console.log('Room or message not found');
          } else {
            res.status(200).json({'message':'DELETED'})
            console.log('Message updated successfully');
          }
        })
        .catch(err => {
          console.error(err);
          res.status(500).json({'message':err})
        });
})

server.listen(10209, () => {
    console.log("Server running on port 10209...")
})
