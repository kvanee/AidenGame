var socket;
socket = io.connect();

canvas_width = window.innerWidth * window.devicePixelRatio; 
canvas_height = window.innerHeight * window.devicePixelRatio;
var game = new Phaser.Game(canvas_width, canvas_height, Phaser.CANVAS, 'phaser-example');

var gameProperties = { 
	//this is the actual game size to determine the boundary of 
	//the world
	gameWidth: 4000, 
	gameHeight: 4000,
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
	game.physics.p2.enableBody(player, true);
	player.body.addCircle(player.body_size, 0 , 0); 
}

// add the 
main.prototype = {
	preload: function() {
		game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
		game.world.setBounds(0, 0, gameProperties.gameWidth, 
		gameProperties.gameHeight, false, false, false, false);
		//I’m using P2JS for physics system. You can choose others if you want
		game.physics.startSystem(Phaser.Physics.P2JS);
		game.physics.p2.setBoundsToWorld(false, false, false, false, false)
		//sets the y gravity to 0. This means players won’t fall down by gravity
		game.physics.p2.gravity.y = 0;
		// turn gravity off
		game.physics.p2.applyGravity = false; 
		game.physics.p2.enableBody(game.physics.p2.walls, false); 
		// turn on collision detection
		game.physics.p2.setImpactEvents(true);

    },
	//this function is fired once when we load the game
	create: function () {
        game.stage.backgroundColor = 0xAAAAAA;
		console.log("client started");
		//listen to the “connect” message from the server. The server 
		//automatically emit a “connect” message when the cleint connets.When 
		//the client connects, call onsocketConnected.  
		onsocketConnected();

    },
    update: function () {
		if (gameProperties.in_game)
		{
			//  400 is the speed it will move towards the mouse
			game.physics.arcade.moveToPointer(sprite, 400);
	
			//  if it's overlapping the mouse, don't move any more
			if (game.physics.arcade.distanceToPointer(player, pointer) <= 50)
			{
				sprite.body.velocity.setTo(0, 0);
			}
		}
		else
		{
			sprite.body.velocity.setTo(0, 0);
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