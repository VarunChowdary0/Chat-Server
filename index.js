const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const { ALL } = require('dns');
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
        console.log(data)
        socket.to(data.room).emit("recive_message",data)
    })
    socket.on("join_room", (data) => {
        socket.join(data.room)
        console.log(`User with id : ${socket.id} joined room : ${data.room} with name : ${data.username}`)
    });

    socket.on("disconnect", () => {
        console.log(`${socket.id} is disconnected.`);
    });
});

server.listen(10201, () => {
    console.log("Server running on port 10201...")
})
