function isset(g, x, y, w, h)
{
	if(x<0)return false;
	if(y<0)return false;
	if(x>=w)return false;
	if(y>=h)return false;
	return g[x*2+1][y*2+1];
}
function set(g, x, y, w, h, val)
{
	if(x<0||y<0||x>=w||y>=h)
		debugger;
	return g[x*2+1][y*2+1] = val;
}
function connect(g, x1, y1, x2, y2)
{
	g[x1+x2+1][y1+y2+1] = false;
}
function mkMaze(offset, dimensions)
{
	var grid = [];
	var w = dimensions[0];
	var h = dimensions[1];

	for(var x = 0; x < w*2+1; x++)
	{
		grid.push([]);
		for(var y = 0; y < h*2+1; y++)
		{
			var val = true;

//			if(y==2&&x==1)
//				val = false;
//			if(x==1&&y==2)
//				val = false;

			grid[grid.length-1].push(val);
		}
	}

	while(true)
	{
		var px=-1;
		var py=-1;
		// find first nonvisited square
		for(var x = 0; x < w; x++) 
		for(var y = 0; y < h; y++) 
		{
			if(isset(grid,x,y,w,h))
			{
				px = x;
				py = y;
				break;
			}
		}
		if(px == -1) // all taken, get out
			break;

		// open it
		set(grid, px, py, w, h, false);

		// connect to a taken cell
		if(px>0 && !isset(grid,px-1,py,w,h))connect(grid,px,py,px-1,py);
		else if(py>0 && !isset(grid,px,py-1,w,h))connect(grid,px,py,px,py-1);
		else if(px<w-1 && !isset(grid,px+1,py,w,h))connect(grid,px,py,px+1,py);
		else if(py<h-1 && !isset(grid,px,py+1,w,h))connect(grid,px,py,px,py+1);

		// take next untaken cell in the neigbourhoor at random
		//
	
		while(true)
		{

		var nx = -1;
		var ny = -1;
	
		var count = 0;
		if(isset(grid, px-1,py,w,h))count++;
		if(isset(grid, px+1,py,w,h))count++;
		if(isset(grid, px,py-1,w,h))count++;
		if(isset(grid, px,py+1,w,h))count++;
		if(count == 0)break;

		var choice = Math.floor(Math.random()*count);
		if(isset(grid, px-1,py,w,h)){if(choice--==0){nx=px-1;ny=py;}}
		if(isset(grid, px+1,py,w,h)){if(choice--==0){nx=px+1;ny=py;}}
		if(isset(grid, px,py-1,w,h)){if(choice--==0){nx=px;ny=py-1;}}
		if(isset(grid, px,py+1,w,h)){if(choice--==0){nx=px;ny=py+1;}}
		
		connect(grid,px,py,nx,ny);
		set(grid, nx, ny, w, h, false);
		px=nx;
		py=ny;
		}
	}


	for(var x = 0; x < w*2+1; x++)
	for(var y = 0; y < h*2+1; y++)
	{
		if(x == w*2-1 && y == h*2-1)continue; // hole you can exit

		if(grid[x][y])
		{
			var obj = World.createObject(Graphics.DarkBlock, x+offset[0], y+offset[1], 1+offset[2]);
		}
		else
		{
			var obj = World.createObject(Graphics.GroundBlock, x+offset[0], y+offset[1], 0+offset[2]);
		}
	}
}

var levels = 10+Math.floor(Math.random()*10);
var pos = [0,0];
for(var i=0;i<levels;i++)
{
	//progressbar(i,levels, "loading");
	var width = 2+Math.floor(Math.random()*10);
	var height = 2+Math.floor(Math.random()*10);

	mkMaze([pos[0],pos[1],-2*i],[width,height]);
	pos[0] += 2*width-2;
	pos[1] += 2*height-2;
}
World.createObject(Graphics.GroundBlock, pos[0]+1,pos[1]+1, -2*levels-2);
var duck = World.createObject(Graphics.Duck, pos[0]+1,pos[1]+1, -2*levels+1, false);


Base.createGuy(1,1,1, false); // No jumping on mazes ;)

function level_loop()
{
	Base.step();
}

initialize();

