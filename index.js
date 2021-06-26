const express = require('express');
const path = require('path');
const http = require('http');
const socketIO =require('socket.io');
const { generateMessage, generateLocationMessage } = require('./src/utils/messages');
const { addUser, removeUser, getUser, getUserInRoom } = require('./src/utils/users');


const app = express();

const server = http.createServer(app);

const io = socketIO(server);

const publicDirectoryPath = path.join(__dirname,'/public');

app.use(express.static(publicDirectoryPath));

const port = process.env.PORT ||3000;

io.on('connection',(socket)=>{
    socket.on('sendMessage',(message,callback)=>{
        const user = getUser(socket.id);
        io.to(user.room).emit('message',generateMessage(user.username,message));
        callback('Delivered!');
    });
    
    socket.on('disconnect',()=>{
        const user = removeUser(socket.id);
        if(user){
            io.emit('message',generateMessage('Admin ',`${user.username} has left`));
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUserInRoom(user.room)
            })
        }

    })
    
    socket.on('sendLocation',(coords,callback)=>{
        const user = removeUser(socket.id);
        io.to(user.room).emit('locationMessage',generateLocationMessage(`https://www.google.com/maps?q=${coords.longitude},${coords.latitude}`));
        callback();
    });
    
    socket.on('join',(options,callback)=>{
        try{
            const user=  addUser({id:socket.id, ...options})
            socket.join(user.room);
            
            socket.emit('message',generateMessage('Admin','Welcome!'));
            socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined`));
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUserInRoom(user.room)
            })
            callback();
        }catch(error){
            callback(error);
        }
        
    })
})


server.listen(port,()=>{
    console.log(`app is running on ${port}`)
});