
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

/*
 * Engine
 */
var Graphics = {
	DudeTop :	[
					[[0,3],[1,3],[2,3],[3,3]], // north
					[[0,4],[1,4],[2,4],[3,4]], // east
					[[0,2],[1,2],[2,2],[3,2]], // south
					[[0,5],[1,5],[2,5],[3,5]] // west
				],
	DudeBottom : [
					[[4,3],[5,3],[6,3],[7,3]],
					[[4,4],[5,4],[6,4],[7,4]],
					[[4,2],[5,2],[6,2],[7,2]],
					[[4,5],[5,5],[6,5],[7,5]]
				],
	HillRugged : [[0,8],[0,10],[0,9],[1,8]],
	HillPlain : [[4,8],[4,10],[4,9],[5,8]],
	GroundRugged : [1,9],
	GroundPlain : [5,9],
	Lift : [[0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6]],
	Water: [[2,0],[3,0]]
};

function initialize()
{
	var canvas = document.getElementById('canvas');  
	Graphics.ctx = canvas.getContext('2d');

	Graphics.tileset = new Image();
	Graphics.tileset.onload = game_start;
	Graphics.tileset.src = Config.graphics;
}
function game_start()
{
	setTimeout(game_loop, 100);
}

function game_loop()
{
	setTimeout(game_loop, 100);

	for(var y = 0 ; y < 10; y++) 
	for(var x = 0 ; x < 10; x++) 
	{
		draw(Graphics.Water, 32*x + 16*y, 8*y, Math.floor(Math.random()*2));
	}
}


