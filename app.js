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
// when a new player connects, we make a new instance of the player object,
// and send a new player message to the client. 
function onNewplayer (data) {
	console.log(data);
	//new player instance
	var newPlayer = new Player(data.x, data.y, data.angle);
	console.log(newPlayer);
	console.log("created new player with id " + this.id);
	newPlayer.id = this.id; 	
	//information to be sent to all clients except sender
	var current_info = {
		id: newPlayer.id, 
		x: newPlayer.x,
		y: newPlayer.y,
		angle: newPlayer.angle,
	}; 
	
	//send to the new player about everyone who is already connected. 	
	for (i = 0; i < player_lst.length; i++) {
		existingPlayer = player_lst[i];
		var player_info = {
			id: existingPlayer.id,
			x: existingPlayer.x,
			y: existingPlayer.y, 
			angle: existingPlayer.angle,			
		};
		console.log("pushing player");
		//send message to the sender-client only
		this.emit("new_enemyPlayer", player_info);
	}
	
	//send message to every connected client except the sender
	this.broadcast.emit('new_enemyPlayer', current_info);
	player_lst.push(newPlayer); 
}

//update the player position and send the information back to every client except sender
function onMovePlayer (data) {
	
	var movePlayer = find_playerid(this.id); 
	movePlayer.x = data.x;
	movePlayer.y = data.y;
	movePlayer.angle = data.angle; 
	
	var moveplayerData = {
		id: movePlayer.id,
		x: movePlayer.x,
		y: movePlayer.y, 
		angle: movePlayer.angle
	}
	console.log('move player:' + JSON.stringify(moveplayerData)); 
	//send message to every connected client except the sender
	this.broadcast.emit('enemy_move', moveplayerData);
}

//call when a client disconnects and tell the clients except sender to remove the disconnected player
function onClientdisconnect() {
	console.log('disconnect'); 

	var removePlayer = find_playerid(this.id); 
		
	if (removePlayer) {
		player_lst.splice(player_lst.indexOf(removePlayer), 1);
	}
	
	console.log("removing player " + this.id);
	
	//send message to every connected client except the sender
	this.broadcast.emit('remove_player', {id: this.id});
	
}

// find player by the the unique socket id 
function find_playerid(id) {
	
		for (var i = 0; i < player_lst.length; i++) {
	
			if (player_lst[i].id == id) {
				return player_lst[i]; 
			}
		}
		
		return false; 
	}

// listen for a connection request from any client
io.sockets.on('connection', function(socket){
	console.log("socket connected"); 
	//output a unique socket.id 
	// listen for disconnection; 
	socket.on('disconnect', onClientdisconnect); 
	
	// listen for new player
	socket.on("new_player", onNewplayer);
	// listen for player position update
	socket.on("move_player", onMovePlayer);
});