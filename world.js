
/*
 * We represent the world as a large 3d grid of objects
 */


World = {
	_grid : new Object(),
	_boundary : [[0,0,0],[10,10,10]],
	_proxy : [],

	getObjectAt : function(x,y,z)
	{
		return World.grid[x][y][z];
	},
	loadFrom : function(url)
	{
			
	},
	save : function()
	{
	
	},
	createObject : function(tiles, x, y, z)
	{
		var obj = 
		{
			x: x,
			y: y,
			z: z,
			tiles: tiles,
			direction: 0,
			frame: 0, // current frame
			frameTick: 0, // current tick
			frameMaxTicks: 1, // ticks to reach until we switch to next frame (0 to disable animation)
		};
		if(World._grid[x] == undefined)World._grid[x] = {};
		if(World._grid[x][y] == undefined)World._grid[x][y] = {};
		World._grid[x][y][z] = obj;
		return obj;
	},
	render : function()
	{
		// Drawing order is important
		// First grab all objects to a single array
		// Sort it
		// Draw it
		var arr = [];
		for(var x in World._grid)
		{
			for(var y in World._grid[x])
			{
				for(var z in World._grid[x][y])
				{
					arr.push(World._grid[x][y][z]);
				}
			}
		}

		arr.sort(function(a,b){
			return (a.x+a.y+a.z) - (b.x+b.y+b.z);
		});

		for(var i = 0; i < arr.length; i++)
		{
			World.drawSingleObject(arr[i]);
		}
	},
	drawSingleObject : function(obj)
	{
		var framedata = null;
		var g = obj.tiles.g;
		if(obj.tiles.t & DIRECTED)
		{
			framedata = obj.direction;
			g = obj.tiles.g[obj.direction];
		}
		if(obj.tiles.t & ANIMATED || obj.tiles.t & ANIMATED_RANDOM)
		{
			// Increment frame tick counter
			obj.frameTick ++;
			if(obj.frameTick >= obj.frameMaxTicks)
			{
				obj.frameTick = 0;
				if(obj.tiles.t & ANIMATED_RANDOM)
				{
					obj.frame = Math.floor(Math.random() * g.length) % g.length;
				}
				else
				{
					obj.frame = (obj.frame+1) % g.length;
				}
			}

			if(framedata == null)
				framedata = obj.frame;
			else
				framedata = [framedata, obj.frame];
		}

		draw(obj.tiles.g, 320+(obj.x-obj.y)*16, 240+(obj.x+obj.y)*8, framedata);
	}
};

