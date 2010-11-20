
/*
 * We represent the world as a large 3d grid of objects
 */


World = {
	_grid : {},
	_boundary : [[0,0,0],[10,10,10]]
	_proxy : [],

	getObjectAt : function(x,y,z)
	{
		return World.grid[x][y][z];
	}	 
};

