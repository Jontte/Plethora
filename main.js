/*
 * Configurables
 */

var Config = {
	graphics : 'tileset.png',
	gamestate : 'halt'
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
	Crate: {t: 0, g: [3,1]},
	Duck: {t: 0, g: [5,1], c: {s: "cylinder", r: 0.2, h: 0.5}},
	Shadow: {t: 0, g: [8,1], c: {s: "cylinder", r: 0.51, h: 5}},
	DarkBlock: {t: 0, g:[0,11], c: {s: 'box', l: 1, h: 0.5}}
};


function reset()
{
	if(Config.gamestate != 'halt')
	{
		Config.gamestate = 'reset';
		// Try again in 50ms
		setTimeout(reset, 50);
		return;
	}

	World.reset();
	// Select & load level
	var levelname = document.getElementById('lselect').value;

	// Add level js file
	var fileref=document.createElement('script');
	fileref.setAttribute("type","text/javascript");
	fileref.setAttribute("src", 'levels/'+levelname+'?invalidate_cache='+(new Date()).getTime());

	if (typeof fileref!="undefined")
		document.getElementsByTagName("head")[0].appendChild(fileref);
	else
		alert('Error loading file!');
}
function initialize()
{
	var canvas = document.getElementById('canvas');  
	Graphics.ctx = canvas.getContext('2d');
	Graphics.ctx.fillStyle = "rgb(96,160,255)";  

	// Start registering keyboard input
	Key.register();

	Graphics.tileset = new Image();
	Graphics.tileset.onload = game_start;
	Graphics.tileset.src = Config.graphics;
	
	Config.gamestate = 'online';
}
function game_start()
{
	// Load level here
	Config.timeout = setTimeout(game_loop, 50);
}

function game_loop()
{
	if(Config.gamestate == 'online')
		setTimeout(game_loop, 50);
	if(Config.gamestate == 'reset')
	{
		Config.gamestate = 'halt';
		return;
	}

	// Clear screen
	Graphics.ctx.fillRect (0, 0, 640, 480);  
	
	World.render();
	World.physicsStep();
	
	// User defined functions
	if(level_loop != undefined)
		level_loop();
}


