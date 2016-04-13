/*@author Anjali

Script for initializing the application and starting the server
*/

//setting up express server
var express=require("express");
var app = express();
var server = require('http').createServer(app);
var io =  require('socket.io')(server);
var port = process.env.PORT || 3000;

//start server
server.listen(port, function(){
console.log('listening on *:3000');
});

//for configuring static files with html
app.use(express.static(__dirname));
app.use("/styles",  express.static(__dirname + '/css'));
app.use("/scripts", express.static(__dirname + '/javascript'));
app.use("/images",  express.static(__dirname + '/images'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var totalUsers=0;

io.on('connection', function(socket){

  var userAdded= false;

  //when server emits chat message event, this handles it
  socket.on('chat message', function(msg){
     io.emit('chat message', {message: msg, username: socket.username});
     console.log("Message is "+ msg);
  });

  //handling setUsername event
  socket.on('setUsername', function(username){
    if(userAdded) return;
    socket.username = username;
    userAdded = true;
    totalUsers++;

    //adding user to the list of online users
    io.emit('onlineUsers',{username: socket.username});

    //broadcasting new user join notification
    io.emit('userJoined', {username: socket.username});
  });

  //handling typing event
  socket.on('typing', function(){
    io.emit('typing', {username: socket.username});
  });

  //handle stop typing event
  socket.on('stopTypig', function(){
    io.emit('stopTyping',{username: socket.username});
  });

  console.log("user connected");
  socket.on('disconnect', function(socket){
    console.log("user disconnected");
  });
});
