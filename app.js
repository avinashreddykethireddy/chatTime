const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users'); 

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const path = require('path');
const PORT = 3000 || process.env.PORT;

// set static folder

app.use(express.static(path.join(__dirname,'public')));

const botname = 'ADMIN';

// runs when client connects
io.on('connection',socket => {
    // console.log("New connectioon");
    
    socket.on('joinRoom',({username,room}) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        // current user
        socket.emit('message', formatMessage(botname,'Welcome Chater!!'));

        // broadcast when a user connects
        socket.broadcast
            .to(user.room)
            .emit('message', formatMessage(botname,`${user.username} has joined the chat`));

        // to broadcast every one do { io.emit } inplace if socket.emit
        
        // send users and room info
        io.to(user.room).emit('roomUsers',{
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });
    

    // listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        // console.log(msg);
        io.to(user.room).emit('message',formatMessage(user.username, msg));
    });

    
    //runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit('message',formatMessage(botname,`${user.username} has left the chat`));
            
             // send users and room info
            io.to(user.room).emit('roomUsers',{
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
});


// server.listen(PORT,() => console.log(`Server running at ${PORT}`) );
server.listen(process.env.PORT,process.env.IP);
