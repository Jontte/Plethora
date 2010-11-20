
/*
 * Configurables
 */

var Config = {
	graphics : 'tileset.png',
};

/* 
 * Internal constants
 */

var NORTH = 0;
var EAST = 1;
var SOUTH = 2;
var WEST = 3;

var DIRECTED		= 1; // Tiles that have separate frames for separate directions
var ANIMATED		= 2; // Tiles that can be animated
var ANIMATED_RANDOM = 4; // .. with random frame order
/*
 * Engine
 */
var Graphics = {
	DudeTop :	{
					t: DIRECTED | ANIMATED, // Animation type
					g: [ // Tile indexes
						[[0,3],[1,3],[2,3],[3,3]], // north
						[[0,4],[1,4],[2,4],[3,4]], // east
						[[0,2],[1,2],[2,2],[3,2]], // south
						[[0,5],[1,5],[2,5],[3,5]] // west
					],
					c: { // Collision data (dfaults to solid 1x1x1 cube)
						s: "cylinder", // Cylinder shape
						r: 0.25, // Radius 
						h: 1 // Height
					} 
				},
	DudeBottom : {
					t: DIRECTED | ANIMATED,
					g: [
						[[4,3],[5,3],[6,3],[7,3]],
						[[4,4],[5,4],[6,4],[7,4]],
						[[4,2],[5,2],[6,2],[7,2]],
						[[4,5],[5,5],[6,5],[7,5]]
					],
					c: {
						s: "cylinder",
						r: 0.45,
						h: 1
					} 
				 },
	HillRugged : {t : DIRECTED, g: [[0,8],[0,10],[0,9],[1,8]]},
	HillPlain : {t: DIRECTED, g: [[4,8],[4,10],[4,9],[5,8]]},
	GroundRugged : {t: 0, g:[1,9]},
	GroundPlain : {t: 0, g: [5,9]},
	Lift : {t: ANIMATED,g: [[0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6]]},
	Water: {t: ANIMATED_RANDOM, g: [[2,0],[3,0]]},
	BarrelWooden: {t: 0, g: [2,1], c: {s: "cylinder", r: 0.40, h: 1}},
	Crate: {t: 0, g: [3,1]}
};

function initialize()
{
	var canvas = document.getElementById('canvas');  
	Graphics.ctx = canvas.getContext('2d');

	// Start registering keyboard input
	Key.register();

	Graphics.tileset = new Image();
	Graphics.tileset.onload = game_start;
	Graphics.tileset.src = Config.graphics;
}
function game_start()
{
	setTimeout(game_loop, 50);

	for(var x = 0; x < 10; x++)
	for(var y = 0; y < 10; y++)
	{
		var d = ((x-4.5)*(x-4.5)+(y-4.5)*(y-4.5));

		var obj = World.createObject(
			(d > 4*4)?Graphics.Water:Graphics.GroundRugged, [x, y, 0]);
		obj.frameMaxTicks = 5;

		if(d < 2*2)
		{
			//World.createObject(Graphics.GroundRugged, [x, y, 1]);
		}
	}

	for(var i = 0; i < 10; i++)
	{
		World.createObject(Graphics.BarrelWooden, [5, 5, 3+i*4]).static = false;
		World.createObject(Graphics.BarrelWooden, [6, 5, 1+i]).static = false;
	}

	var player = World.createObject(Graphics.DudeBottom, [6,6,2]);
	var playerhead = World.createObject(Graphics.DudeTop, [6,6,3]);

	player.static = false;
	playerhead.static = false;

	player.frameMaxTicks=5;
	playerhead.frameMaxTicks=5;

	World.linkObjects(player, playerhead);

	World.setKeyboardControl(player);
	World.setCameraFocus(player);

	var prev = null;
	for(var i = 0; i < 11; i++)
	{
		var obj = World.createObject(Graphics.Crate, [i, 10, 0]);
		obj.static = false;
		if(prev != null)
			World.linkObjects(obj, prev);
		else
		  obj.static = true;
		prev = obj;
	}
	for(var i = 0; i < 40; i++)
	{
		var obj = World.createObject(Graphics.Crate, [10, 9-i, 0]);
		obj.static = false;
		World.linkObjects(obj, prev);
		prev = obj;
	}
}

function game_loop()
{
	setTimeout(game_loop, 50);

	// Clear screen
	Graphics.ctx.fillStyle = "rgb(96,160,255)";  
	Graphics.ctx.fillRect (0, 0, 640, 480);  

	World.physicsStep();
	World.render();
}


