var express = require('express');
var app = express();
var http = require('http').Server(app);
// binds the serv object we created to socket.io
var io = require('socket.io')(http);

app.set('view engine', 'pug')
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use('/scripts', express.static(__dirname + '/node_modules/'));
app.use(express.static('public'));

app.get('/', function (req, res) {
   res.render('index', {title: 'Aiden Game'});
});
var port = process.env.PORT || 3000;

http.listen(port, function () {
    console.log('Example app listening on port ' + port);
  })

//this is where we will store all the players in the client,
// which is connected to the server
var player_lst = [];

// A player “class”, which will be stored inside player list 
var Player = function (startX, startY, startAngle) {
  var x = startX
  var y = startY
  var angle = startAngle
}

//onNewplayer function is called whenever a server gets a message “new_player” from the client
function onNewplayer (data) {
	//form a new player object 
	var newPlayer = new Player(data.x, data.y, data.angle);
	console.log("created new player with id " + this.id);
	player_lst.push(newPlayer); 

}

// listen for a connection request from any client
io.sockets.on('connection', function(socket){
	console.log("socket connected"); 
	//output a unique socket.id 
	console.log(socket.id);
});