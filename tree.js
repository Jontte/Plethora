

/*
 * A generic bounded KD-tree data structure for fixed points in 3D space
 */

function KDTree ()
{
	this.node = null;
	this.data = [];
	this.dirty = false;

	this.reset = function()
	{
		this.node = null;
		this.data = [];
		this.dirty = false;
	};
	this.insert = function(point)
	{
		this.data.push(point);
		this.dirty = true;
	};
	this.maybeOptimize = function()
	{
		if(this.dirty == false)
		  return;
		this.dirty = false;
		this.node = mktree(this.data, 0);
	};
	this.getObjects = function(pos, distance, depth, src)
	{
		if(depth == undefined)
			depth = 0;
		if(src == undefined)
		{
			src = this.node;
			if(this.node == null)
			{
				this.dirty = true;
				return [];
			}
		}
		if(src.length == 0)
			return [];

		if(typeof(src.low)=='undefined') // leaf node is a plain array
		{
			return src;
		}
		var ret = [];
		var axis = depth % 3;
		if(pos[axis]-distance < src.split && pos[axis]+distance >= src.min)
			ret = ret.concat(this.getObjects(pos, distance, depth+1, src.low));
		if(pos[axis]+distance >= src.split && pos[axis]-distance < src.max)
			ret = ret.concat(this.getObjects(pos, distance, depth+1, src.high));
		return ret;
	};
}

function mktree (points, depth, gracecounter)
{
	if(points.length == 0)
	{
		return [];
	}
	if(depth==undefined)
		depth=0;

	if(points.length < 10)
	{
		return points;
	}
	var dim = depth % 3;

	// find median
	var median = [];
	for(var i = 0; i < points.length; i++)
		median.push(points[i].pos[dim]);
	median.sort(function(a,b){return a-b;});
	var medianval = median[Math.floor(median.length/2)];

	var ret = {
		split: medianval,
		min: median[0],
		max: median[median.length-1]
	};

	var low = [];
	var high = [];
	for(var i = 0; i < points.length; i++)
	{
		if(points[i].pos[dim] < medianval)
			low.push(points[i]);
		else
			high.push(points[i]);
	}
	/* experimental:
	 * If many objects are stashes close to each other, there are cases where 
	 * picking median as the pivot will cause infinite recursion since high/low
	 * arrays will not change.
	 *
	 * Solution: add a grace counter parameter to mktree, if it reaches 3 (all 
	 * dimensions), return a plain array with all the objects in it and do not
	 * recurse any further.
	*/
	if(high.length == 0 || low.length == 0)
	{
		if(gracecounter == undefined)
			gracecounter = 1;
		else
		{
			gracecounter++;
			if(gracecounter==3)
			{
				return points;
			}
		}
	}

	ret.low = mktree(low, depth+1, gracecounter);
	ret.high = mktree(high, depth+1, gracecounter);
	return ret;
}

