
/*
 * We represent the world as a large 3d grid of objects
 */


World = {
	_physicsIterations: 2,
	_objects: new Array(),
	loadFrom : function(url)
	{
			
	},
	save : function()
	{
	
	},
	createObject : function(tiles, pos)
	{
		var obj = 
		{
			pos: pos,
			vel: [0,0,0],
			mass: 1,
			tiles: tiles,
			direction: 0,
			static: true, // partake in dynamics simulation if static=false
			frame: 0, // current frame
			frameTick: 0, // current tick
			frameMaxTicks: 1, // ticks to reach until we switch to next frame (0 to disable animation)
		};

		// Physics shape defaults to 1x1x1 box:
		if(tiles.c == undefined)
			tiles.c = {s:'box', h:1, l:1};

		World._objects.push(obj);
		return obj;
	},
	render : function()
	{
		// Drawing order is important
		// Sort all objects by depth before rendering

		World._objects.sort(function(a,b){
			return (a.pos[0]+a.pos[1]+a.pos[2]*2) - (b.pos[0]+b.pos[1]+b.pos[2]*2);
		});

		for(var i = 0; i < World._objects.length; i++)
		{
			World.drawSingleObject(World._objects[i]);
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
					obj.frame = Math.floor(Math.random() * g.length);
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

		draw(obj.tiles.g, 320+(obj.pos[0]-obj.pos[1])*16, 240+(obj.pos[0]+obj.pos[1]-2*obj.pos[2])*8, framedata);
	},

	physicsStep : function()
	{
		for(var iter = 0; iter < World._physicsIterations; iter++)
		{
			// reset forces
			for(var i = 0; i < World._objects.length; i++)
			{
				// gravity
				var obj = World._objects[i];
				obj.force = [0,0,
					(obj.static)?0 : (-0.00981*obj.mass/World._physicsIterations)
				];
			}

			// start with O(n^2)
			for(var i = 0; i < World._objects.length; i++)
			for(var a = i+1; a < World._objects.length; a++)
			{
				var o1 = World._objects[i];
				var o2 = World._objects[a];
				if(o1.static && o2.static)
					continue;
				var normal = World._collide(o1, o2);
				if(normal != false)
				{
					var dx = (o2.pos[0]-o1.pos[0])*normal[0];
					var dy = (o2.pos[1]-o1.pos[1])*normal[1];
					var dz = (o2.pos[2]-o1.pos[2])*normal[2];
					var d = dx*dx+dy*dy+dz*dz;
					d = Math.sqrt(d);

					dx /= d;
					dy /= d;
					dz /= d;

					dx *= 0.1;
					dy *= 0.1;
					dz *= 0.1;

					dx *= 1.0/d;
					dy *= 1.0/d;
					dz *= 1.0/d;

					o1.force[0] -= dx;
					o1.force[1] -= dy;
					o1.force[2] -= dz;
					o2.force[0] += dx;
					o2.force[1] += dy;
					o2.force[2] += dz;
				}
			}
			// euler integrate
			for(var i = 0; i < World._objects.length; i++)
			{
				var obj = World._objects[i];
				if(obj.static)continue;
				obj.vel[0] += obj.force[0]/obj.mass;
				obj.vel[1] += obj.force[1]/obj.mass;
				obj.vel[2] += obj.force[2]/obj.mass;
				obj.pos[0] += obj.vel[0]/World._physicsIterations;
				obj.pos[1] += obj.vel[1]/World._physicsIterations;
				obj.pos[2] += obj.vel[2]/World._physicsIterations;
				
				obj.vel[0] *= 0.99;
				obj.vel[1] *= 0.99;
				obj.vel[2] *= 0.99;
			}
		}
	},
	// Collide two objects, return normal vector of collision or false if no collision
	_collide : function(o1, o2)
	{
		// Z-check first:
		if(o1.pos[2]+o1.tiles.c.h < o2.pos[2])
			return false;
		if(o1.pos[2] > o2.pos[2]+o2.tiles.c.h)
			return false;

		// Treshold for topdown contact :
		var topdown_distance = Math.min(
			 Math.abs((o1.pos[2]+o1.tiles.c.h)-o2.pos[2]),
			 Math.abs(o1.pos[2]-(o2.pos[2]+o2.tiles.c.h))
		);
		var topdown_treshold = 0.1;
		// XY-check:

		if(o1.tiles.c.s == 'cylinder' && o2.tiles.c.s == 'cylinder')
		{
			var d = 
				 (o1.pos[0]-o2.pos[0])*(o1.pos[0]-o2.pos[0])+
				 (o1.pos[1]-o2.pos[1])*(o1.pos[1]-o2.pos[1]);
			if(Math.sqrt(d) < (o1.tiles.c.r + o2.tiles.c.r))
			{
				if(topdown_distance < topdown_treshold)
				  return [0,0,1];
				return [1,1,0];
			}
		}
		else if((o1.tiles.c.s == 'cylinder' && o2.tiles.c.s == 'box')
		|| (o1.tiles.c.s == 'box' && o2.tiles.c.s == 'cylinder'))
		{
			var box = (o1.tiles.c.s=='cylinder')?o2:o1;
			var cyl = (o1.tiles.c.s=='cylinder')?o1:o2;

			// check sides
			if((Math.abs(box.pos[0]-cyl.pos[0]) < (box.l/2+cyl.r)) && 
			  (Math.abs(box.pos[1]-cyl.pos[1]) < (box.l/2+cyl.r)))
			{
				if(topdown_distance < topdown_treshold)
				  return [0,0,1];
				return [1,1,0];
			}
			var dx = 0;
			var dy = 0;

			// check corners
			dx = (box.pos[0]-box.l/2-cyl.pos[0]);
			dy = (box.pos[1]-box.l/2-cyl.pos[1]);
			if(dx*dx+dy*dy < cyl.r*cyl.r) return (topdown_distance<topdown_treshold)?[0,0,1]:[1,1,0];
			dx = (box.pos[0]+box.l/2-cyl.pos[0]);
			dy = (box.pos[1]-box.l/2-cyl.pos[1]);
			if(dx*dx+dy*dy < cyl.r*cyl.r) return (topdown_distance<topdown_treshold)?[0,0,1]:[1,1,0];
			dx = (box.pos[0]-box.l/2-cyl.pos[0]);
			dy = (box.pos[1]+box.l/2-cyl.pos[1]);
			if(dx*dx+dy*dy < cyl.r*cyl.r) return (topdown_distance<topdown_treshold)?[0,0,1]:[1,1,0];
			dx = (box.pos[0]+box.l/2-cyl.pos[0]);
			dy = (box.pos[1]+box.l/2-cyl.pos[1]);
			if(dx*dx+dy*dy < cyl.r*cyl.r) return (topdown_distance<topdown_treshold)?[0,0,1]:[1,1,0];
		}
		else {
			debug('Unhandled collision for: ' + o1.tiles.c.s + ' vs ' + o2.tiles.c.s);
		}
		return false;
}
};

