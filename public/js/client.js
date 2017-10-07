var socket;
socket = io.connect();

canvas_width = window.innerWidth * window.devicePixelRatio; 
canvas_height = window.innerHeight * window.devicePixelRatio;
var game = new Phaser.Game(canvas_width, canvas_height, Phaser.CANVAS, 'gameDiv');

var enemies = {};

var gameProperties = { 
	//this is the actual game size to determine the boundary of 
	//the world
	gameWidth: 4000, 
	gameHeight: 4000,
	game_elemnt: "gameDiv",
	in_game: false,
};

var playerProperties = {
	speed: 400
};
// this is the main game state
var main = function(game){
};

//call this function when the player connects to the server.
function onsocketConnected () {
	//create a main player object for the connected user to control
	createPlayer();
	gameProperties.in_game = true;
	// send to the server a "new_player" message so that the server knows
	// a new player object has been created
	socket.emit('new_player', {x: 0, y: 0, angle: 0});
}

function onRemovePlayer (data) {
	var removePlayer = enemies[data.id];
	// Player not found
	if (!removePlayer) {
		console.log('Player not found: ', data.id)
		return;
	}
	
	removePlayer.player.destroy();
	delete enemies[data.id];
}

function createPlayer () {
    console.log("create player");
	//uses Phaser’s graphics to draw a circle
	player = game.add.graphics(0, 0);
	player.radius = 100;

	// set a fill and line style
	player.beginFill(0x2f00ff);
	player.lineStyle(2, 0x2f00ff, 1);
	player.drawCircle(0, 0, player.radius * 2);
	player.endFill();
	player.anchor.setTo(0.5,0.5);
	player.body_size = player.radius; 

	// draw a shape
	game.physics.enable(player, Phaser.Physics.ARCADE);
}

// this is the enemy class. 
var remote_player = function (id, startx, starty, start_angle) {
	this.x = startx;
	this.y = starty;
	//this is the unique socket id. We use it as a unique name for enemy
	this.id = id;
	this.angle = start_angle;
	
	this.player = game.add.graphics(this.x , this.y);
	this.player.radius = 100;

	// set a fill and line style
	this.player.beginFill(0xffd900);
	this.player.lineStyle(2, 0xffd900, 1);
	this.player.drawCircle(0, 0, this.player.radius * 2);
	this.player.endFill();
	this.player.anchor.setTo(0.5,0.5);
	this.player.body_size = this.player.radius; 

	// draw a shape
	game.physics.enable(this.player, Phaser.Physics.ARCADE);
	//this.player.body.clearShapes();
	//this.player.body.addCircle(this.player.body_size, 0 , 0); 
	//this.player.body.data.shapes[0].sensor = true;
}

//Server will tell us when a new enemy player connects to the server.
//We create a new enemy in our game.
function onNewPlayer (data) {
	console.log("new player");
	console.log(data);
	//enemy object 
	var new_enemy = new remote_player(data.id, data.x, data.y, data.angle); 
	enemies[data.id] = new_enemy;
}

//Server tells us there is a new enemy movement. We find the moved enemy
//and sync the enemy movement with the server
function onUpdatePlayerPositions (data) {
	for (var key in data) {
		var element = data[key];
		var movePlayer = enemies[element.id]; 
		
		if (movePlayer) {
			var distance = Phaser.Math.distance(movePlayer.player.body.x,movePlayer.player.body.y,element.x,element.y);
			var duration = distance*10;
			var tween = game.add.tween(movePlayer.player);
			tween.to({x:element.x,y:element.y}, 1);
			tween.start();
		}
	}
}

// add the 
main.prototype = {
	preload: function() {
		game.stage.disableVisibilityChange = true;
		game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
		game.world.setBounds(0, 0, gameProperties.gameWidth, gameProperties.gameHeight, false, false, false, false);
		//I’m using P2JS for physics system. You can choose others if you want
		game.physics.startSystem(Phaser.Physics.P2JS);
		game.physics.p2.setBoundsToWorld(false, false, false, false, false)
		//sets the y gravity to 0. This means players won’t fall down by gravity
		game.physics.p2.gravity.y = 0;
		// turn gravity off
		game.physics.p2.applyGravity = false; 
		game.physics.p2.enableBody(game.physics.p2.walls, false); 
		// turn on collision detection
		//game.physics.p2.setImpactEvents(true);

    },
	//this function is fired once when we load the game
	create: function () {
        game.stage.backgroundColor = 0xAAAAAA;
		console.log("client started");
		//listen to the “connect” message from the server. The server 
		//automatically emit a “connect” message when the cleint connets.When 
		//the client connects, call onsocketConnected.  
		onsocketConnected();

		//listen to new enemy connections
		socket.on("new_enemyPlayer", onNewPlayer);
		
		//listen to enemy movement 
		socket.on("update_player_positions", onUpdatePlayerPositions);
		
		// when received remove_player, remove the player passed; 
		socket.on('remove_player', onRemovePlayer);
    },
    update: function () {
		if (gameProperties.in_game && game.input.mousePointer.isDown)
		{
			var pointer = game.input.activePointer;

			//  if it's overlapping the mouse, don't move any more
			if (game.physics.arcade.distanceToPointer(player, pointer) <= 50)
				player.body.velocity.setTo(0, 0);
			
			else {
				game.physics.arcade.moveToPointer(player, playerProperties.speed);
				socket.emit('move_player', {x: player.x, y: player.y, angle: player.angle});
			}
			
		}
		else
		{
			player.body.velocity.setTo(0, 0);
		}
	}
}

// wrap the game states.
var gameBootstrapper = {
    init: function(gameContainerElementId) {
		game.state.add('main', main);
		game.state.start('main'); 
    }
};;

//call the init function in the wrapper and specifiy the division id 
gameBootstrapper.init("gameDiv");