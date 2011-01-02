/*
 * Configurables
 */

var Config = {
	graphics : 'tileset.png',
	gamestate : 'halt',
	FPS: 20
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
	img: {}, // Loaded images are placed here
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
						r: 0.4, // Radius 
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
						r: 0.4,
						h: 1
					} 
				 },
	HillRugged : {t : DIRECTED, g: [[0,8],[0,10],[0,9],[1,8]]},
	HillPlain : {t: DIRECTED, g: [[4,8],[4,10],[4,9],[5,8]]},
	GroundRugged : {t: 0, g:[1,9]},
	GroundPlain : {t: 0, g: [5,9]},
	GroundBlock : {t: 0, g: [3,9]},
	Lift : {t: ANIMATED,g: [[0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6]]},
	Water: {t: ANIMATED_RANDOM, g: [[2,0],[3,0]]},
	BarrelWooden: {t: 0, g: [2,1], c: {s: "cylinder", r: 0.40, h: 1}},
	Crate: {t: 0, g: [3,1], c: {s: "box", l: 1.0, h: 1.0}},
	Duck: {t: 0, g: [5,1], c: {s: "cylinder", r: 0.2, h: 0.5}},
	CompanionCube: {t: 0, g: [4,1], c: {s: "box", l: 1.0, h: 1.0}},
	Shadow: {t: 0, g: [8,1], c: {s: "cylinder", r: 0.51, h: 5}},
	DarkBlock: {t: 0, g:[0,11], c: {s: 'box', l: 1, h: 0.5}},
	FenceX: {t: 0, g:[4,0], c: {s: 'box', l: 1, h: 1.0}},
	FenceY: {t: 0, g:[5,0], c: {s: 'box', l: 1, h: 1.0}}
};


function reset()
{
	if(Config.gamestate == 'online')
	{
		Config.gamestate = 'reset';
		// Try again in 50ms
		setTimeout(reset, 50);
		return;
	}
	if(Config.gamestate != 'halt')
		return;

	Config.gamestate = 'initializing';

	World.reset();

	// Select & load level
	var levelname = document.getElementById('lselect').value;
	document.getElementById('lselect').blur();
	document.getElementById('selector').blur();

	// Load level and initialize
	var head= document.getElementsByTagName('head')[0];
	var script= document.createElement('script');

	script.type= 'text/javascript';
	script.src='index.php?level='+levelname;

	head.appendChild(script);
}
function load_gfx(filename, onload)
{
	// Makes sure an external img file is loaded into memory
	// Optional onload function may be specified
	if(!Graphics.img[filename])
	{
		var img = new Image();
		img.src = filename;
		if(onload)
		{
			img.onload = onload;
		}
		Graphics.img[filename] = img;
	}
}
function initialize()
{
	var canvas = document.getElementById('canvas');  
	canvas.focus();
	Graphics.ctx = canvas.getContext('2d');

	// Start registering keyboard input
	Key.register();

	load_gfx('cloud1.png');
	load_gfx('cloud2.png');
	load_gfx('cloud3.png');
	load_gfx('cloud4.png');
	load_gfx('cloud5.png');
	load_gfx('stars.png');
	load_gfx('tileset.png');

	Config.gamestate = 'online';
	Config.intervalID = setInterval(game_loop, 1000/Config.FPS);
}

function game_loop()
{
	if(Config.gamestate != 'online')
	{
		clearInterval(Config.intervalID);
	}
	if(Config.gamestate == 'reset')
	{
		Config.gamestate = 'halt';
		return;
	}

	// Clear screen
	//Graphics.ctx.globalAlpha = 1.0;
	Graphics.ctx.fillRect (0, 0, 640, 480);  	
	//Graphics.ctx.globalAlpha = 0.5;

	World.render();
	World.physicsStep();
	
	// User defined functions
	if(level_loop != undefined)
		level_loop();

	// Reset key states
	Key.timestep();
}


