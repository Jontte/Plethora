
/*
 * We represent the world as a large 3d grid of objects
 */


World = {
	_physicsIterations: 4,
	_objects: new Array(),
	_control: null,
	addKeyboardControl : function(obj)
	{
		World._control = obj;
	},
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
		var g = obj.tiles.g;
		if((obj.tiles.t & DIRECTED))
		{
			g = g[obj.direction];
		}
		
		if((obj.tiles.t & ANIMATED) || (obj.tiles.t & ANIMATED_RANDOM))
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
			g = g[obj.frame];
		}

		var fx = g[0];
		var fy = g[1];

		draw(obj.tiles.g, 320+(obj.pos[0]-obj.pos[1])*16, 240+(obj.pos[0]+obj.pos[1]-2*obj.pos[2])*8, fx, fy);
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
			
			// Keyboard controlled object gets some force
			if(World._control != null)
			{
				var obj = World._control;
				var d = 0.01;
				if(Key.get(KEY_LEFT)){ 
				  obj.force[0] -= d;
				  obj.force[1] += d;
				}
				if(Key.get(KEY_RIGHT)){ 
				  obj.force[0] += d;
				  obj.force[1] -= d;
				}
				if(Key.get(KEY_UP)){ 
				  obj.force[0] -= d;
				  obj.force[1] -= d;
				}
				if(Key.get(KEY_DOWN)){ 
				  obj.force[0] += d;
				  obj.force[1] += d;
				}
			}

			// Sweep-line the objects

			var proxyarray = new Array();

			for(var i = 0; i < World._objects.length; i++)
			{
				var obj = World._objects[i];
				proxyarray.push({
					begin: true,
					d: obj.pos[0] + obj.pos[1] + obj.pos[2] - 0.8, // 1.6 is about sqrt(3)/2
					obj: obj,
					id: i
				});
				proxyarray.push({
					begin: false,
					d: obj.pos[0] + obj.pos[1] + obj.pos[2] + 0.8,
					obj: obj,
					id: i
				});
			}
			proxyarray.sort(function(a,b){
				return a.d - b.d;
			});

			var objectbuffer = [];
			for(var i = 0; i < proxyarray.length; i++)
			{
				var p = proxyarray[i];
				if(p.begin == false)
				{
					// Remove object from buffer
					delete objectbuffer[p.id];
				}
				else
				{
					var o1 = p.obj;
					for(var other in objectbuffer)
					{
						if(!objectbuffer.hasOwnProperty(other))continue;
						
						var o2 = objectbuffer[other].obj;
						
						if(o1.static == true && o2.static == true)
							continue;
						var colldata = World._collide(o1, o2);
						if(colldata != false)
						{
							var normal = colldata[0];
							var displacement = colldata[1];

							var dx = (o2.pos[0]-o1.pos[0])*normal[0];
							var dy = (o2.pos[1]-o1.pos[1])*normal[1];
							var dz = (o2.pos[2]-o1.pos[2])*normal[2];
							var d = dx*dx+dy*dy+dz*dz;
							d = Math.sqrt(d);

							dx /= d;
							dy /= d;
							dz /= d;

							dx *= displacement;
							dy *= displacement;
							dz *= displacement;

							o1.force[0] -= dx;
							o1.force[1] -= dy;
							o1.force[2] -= dz;
							o2.force[0] += dx;
							o2.force[1] += dy;
							o2.force[2] += dz;

							if(o1.static == true)
							  o1.mass = 1e99;
							if(o2.static == true)
							  o2.mass = 1e99;

							var mean = [
								 o1.vel[0]*o1.mass + o2.vel[0]*o2.mass,
								 o1.vel[1]*o1.mass + o2.vel[1]*o2.mass,
								 o1.vel[2]*o1.mass + o2.vel[2]*o2.mass
								 ];

							mean[0] /= o1.mass + o2.mass;
							mean[1] /= o1.mass + o2.mass;
							mean[2] /= o1.mass + o2.mass;

							if(normal[0]>0){
								o1.vel[0] = mean[0];
								o2.vel[0] = mean[0];
							}
							if(normal[1]>0){
								o1.vel[1] = mean[1];
								o2.vel[1] = mean[1];
							}
							if(normal[2]>0){
								o1.vel[2] = mean[2];
								o2.vel[2] = mean[2];
							}
						}
					}
					// Add object to buffer 
					objectbuffer[p.id] = p;	
				}
			}
			// euler integrate
			for(var i = 0; i < World._objects.length; i++)
			{
				var obj = World._objects[i];
				if(obj.static==true)continue;
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
	// Collide two objects
	// return free axii for collision response and amount of displacement
	// or false if no collision
	// for example [[0,0,1], 0.1] means the two objects have penetrated 0.1 units and will have to be moved outwards eachother in the z axis
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
				  return [[0,0,1], topdown_distance];
				return [[1,1,0], o1.tiles.c.r+o2.tiles.c.r-Math.sqrt(d)];
			}
		}
		else if((o1.tiles.c.s == 'cylinder' && o2.tiles.c.s == 'box')
		|| (o1.tiles.c.s == 'box' && o2.tiles.c.s == 'cylinder'))
		{
			var box = (o1.tiles.c.s=='cylinder')?o2:o1;
			var cyl = (o1.tiles.c.s=='cylinder')?o1:o2;

			// check sides
			if((Math.abs(box.pos[0]-cyl.pos[0]) < (box.tiles.c.l/2+cyl.tiles.c.r)) && 
			  (Math.abs(box.pos[1]-cyl.pos[1]) < (box.tiles.c.l/2+cyl.tiles.c.r)))
			{
				if(topdown_distance < topdown_treshold)
				  return [[0,0,1], topdown_distance];
				return [1,1,0];
			}
			var dx = 0;
			var dy = 0;
			var d = 0;

			// check corners
			dx = (box.pos[0]-box.l/2-cyl.pos[0]);
			dy = (box.pos[1]-box.l/2-cyl.pos[1]);
			d = cyl.r*cyl.r-dx*dx+dy*dy;
			if(d > 0) return (topdown_distance<topdown_treshold)?[[0,0,1], topdown_distance]:[[1,1,0], sqrt(d)];
			dx = (box.pos[0]+box.l/2-cyl.pos[0]);
			dy = (box.pos[1]-box.l/2-cyl.pos[1]);
			d = cyl.r*cyl.r-dx*dx+dy*dy;
			if(d > 0) return (topdown_distance<topdown_treshold)?[[0,0,1], topdown_distance]:[[1,1,0], sqrt(d)];
			dx = (box.pos[0]-box.l/2-cyl.pos[0]);
			dy = (box.pos[1]+box.l/2-cyl.pos[1]);
			d = cyl.r*cyl.r-dx*dx+dy*dy;
			if(d > 0) return (topdown_distance<topdown_treshold)?[[0,0,1], topdown_distance]:[[1,1,0], sqrt(d)];
			dx = (box.pos[0]+box.l/2-cyl.pos[0]);
			dy = (box.pos[1]+box.l/2-cyl.pos[1]);
			d = cyl.r*cyl.r-dx*dx+dy*dy;
			if(d > 0) return (topdown_distance<topdown_treshold)?[[0,0,1], topdown_distance]:[[1,1,0], sqrt(d)];
		}
		else {
			debug('Unhandled collision for: ' + o1.tiles.c.s + ' vs ' + o2.tiles.c.s);
		}
		return false;
}
};

