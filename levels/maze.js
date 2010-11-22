
var Game = {
	player: {}
};


var grid = [];
var w = 20;
var h = 20;

for(var x = 0; x < w*2+1; x++)
{
	grid.push([]);
for(var y = 0; y < w*2+1; y++)
{
	var val = true;

	if(y==2&&x==1)
		val = false;
	if(x==1&&y==2)
		val = false;

	grid[grid.length-1].push(val);
}
}


function isset(g, x, y)
{
	if(x<0)return false;
	if(y<0)return false;
	if(x>=w)return false;
	if(y>=h)return false;
	return g[x*2+1][y*2+1];
}
function set(g, x, y, val)
{
	if(x<0||y<0||x>=w||y>=h)
		debugger;
	return g[x*2+1][y*2+1] = val;
}
function connect(g, x1, y1, x2, y2)
{
	g[x1+x2+1][y1+y2+1] = false;
}
while(true)
{
	var px=-1;
	var py=-1;
	// find first nonvisited square
	for(var x = 0; x < w; x++) 
	for(var y = 0; y < h; y++) 
	{
		if(isset(grid,x,y))
		{
			px = x;
			py = y;
			break;
		}
	}
	if(px == -1) // all taken, get out
		break;

	// open it
	set(grid, px, py, false);

	// connect to a taken cell
	if(px>0 && !isset(grid,px-1,py))connect(grid,px,py,px-1,py);
	else if(py>0 && !isset(grid,px,py-1))connect(grid,px,py,px,py-1);
	else if(px<w-1 && !isset(grid,px+1,py))connect(grid,px,py,px+1,py);
	else if(py<h-1 && !isset(grid,px,py+1))connect(grid,px,py,px,py+1);

	// take next untaken cell in the neigbourhoor at random
	//
	
	while(true)
	{
	var nx = -1;
	var ny = -1;
	
	var count = 0;
	if(isset(grid, px-1,py))count++;
	if(isset(grid, px+1,py))count++;
	if(isset(grid, px,py-1))count++;
	if(isset(grid, px,py+1))count++;
	if(count == 0)break;

	var choice = Math.floor(Math.random()*count);
	if(isset(grid, px-1,py)){if(choice--==0){nx=px-1;ny=py;}}
	if(isset(grid, px+1,py)){if(choice--==0){nx=px+1;ny=py;}}
	if(isset(grid, px,py-1)){if(choice--==0){nx=px;ny=py-1;}}
	if(isset(grid, px,py+1)){if(choice--==0){nx=px;ny=py+1;}}
		
	connect(grid,px,py,nx,ny);
	set(grid, nx, ny, false);
	px=nx;
	py=ny;

	}
}


for(var x = 0; x < w*2+1; x++)
for(var y = 0; y < h*2+1; y++)
{
	if(grid[x][y])
	{
		var obj = World.createObject(Graphics.DarkBlock, [x, y, 1]);
	}
	else
	{
		var obj = World.createObject(Graphics.GroundBlock, [x, y, 0]);
	}
}

Game.player = World.createObject(Graphics.DudeBottom, [1,1,1], false);
Game.player.head = World.createObject(Graphics.DudeTop, [1,1,2], false);

Game.player.frameMaxTicks=5;
Game.player.head.frameMaxTicks=5;

World.linkObjects(Game.player, Game.player.head);

var duck = World.createObject(Graphics.Duck, [w*2-1,h*2-1,2], false);

World.setKeyboardControl(Game.player);
World.setCameraFocus(Game.player);

function level_loop()
{
	// Synch head movement to body movement
	Game.player.head.direction = Game.player.direction;
}


// Finished loading level.
initialize();

