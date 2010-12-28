
World = {
	_physicsIterations: 4,
	_objects: new Array(),
	_proxy: new Array, // broadphase sweep & prune proxy array
	_tree: new KDTree(), // KD-Tree for static objects
	_links: new Array(),
	_control: null,
	_cameraFocus: null,
	_cameraPos: [0,0,0],
	reset : function()
	{
		World._objects = new Array();
		World._proxy = new Array();
		World._links = new Array();
		World._control = null;
		World._cameraFocus = null;
		World._tree.reset();
		//Patch.reset();
	},
	setKeyboardControl : function(obj)
	{
		World._control = obj;
	},
	setCameraFocus : function(obj)
	{
		World._cameraFocus = obj;
	},
	loadFrom : function(url)
	{
			
	},
	save : function()
	{
	
	},
	createObject : function(tiles, pos, static)
	{
		if(static==undefined)
			static=true;
		var obj = 
		{
			pos: pos,
			vel: [0,0,0],
			mass: 1,
			tiles: tiles,
			direction: 0,
			static: static, // partake in dynamics simulation if static=false
			frame: 0, // current frame
			frameTick: 0, // current tick
			frameMaxTicks: 1, // ticks to reach until we switch to next frame (0 to disable animation)
		};

		// Physics shape defaults to 1x1x1 box:
		if(tiles.c == undefined)
			tiles.c = {s:'box', h:1, l:1};

		World._objects.push(obj);

		if(static==false)
		{
			// Moving objects use sweep&prune
			World._proxy.push({
				begin: true,
				d: 0,
				obj: obj
			});
			World._proxy.push({
				begin: false,
				d: 0,
				obj: obj
			});
		}
		else {
			// Whereas static objects go to a large kd-tree for collision testing
			World._tree.insert({pos: pos, obj: obj});

			// ... And to the patch manager for optimal drawing
			//Patch.addToCache(obj);
		}
		return obj;
	},
	linkObjects: function(o1, o2, maxforce)
	{
		// Negative maxforce = unbreakable link
		if(maxforce == undefined)maxforce = -1;
		var lnk = {
			o1 : o1,
			o2 : o2,
			maxforce : maxforce,
			dpos : [o2.pos[0]-o1.pos[0],o2.pos[1]-o1.pos[1],[o2.pos[2]-o1.pos[2]]]
		};
		World._links.push(lnk);
		return lnk;
	},
	removeLink: function(o1, o2)
	{
		for(var i = 0; i < World._links.length; i++)
		{
			var l = World._links[i];
			if(l.o1 = o1 && l.o2 == o2)
			{
				delete World._links[i];
				i--;
			}
		}
	},
	render : function()
	{
		console.time('render');

		// Update camera position
		if(World._cameraFocus != null)
		{
			World._cameraPos[0] = World._cameraFocus.pos[0];
			World._cameraPos[1] = World._cameraFocus.pos[1];
			World._cameraPos[2] = World._cameraFocus.pos[2];
			
			// Update world sky color based on new camera position
			var r,g,b;
			var h = World._cameraPos[2];
			// Color at zero height
			var midpoint = [96,127,255];

			var edges = [-100, 100];
			if(h > 0) {
				if(h>edges[1])h=edges[1];
				r = midpoint[0]+(255-midpoint[0])*(h/edges[1]);
				g = midpoint[1]+(255-midpoint[1])*(h/edges[1]);
				b = midpoint[2]+(255-midpoint[2])*(h/edges[1]);
			}
			else {
				if(h<edges[0])h=edges[0];
				r = midpoint[0]+(0-midpoint[0])*(h/edges[0]);
				g = midpoint[1]+(0-midpoint[1])*(h/edges[0]);
				b = midpoint[2]+(0-midpoint[2])*(h/edges[0]);
			}
			r=Math.floor(r);
			g=Math.floor(g);
			b=Math.floor(b);

			// Change sky color
			Graphics.ctx.fillStyle = 'rgb('+r+','+g+','+b+')';
		}

		// Drawing order is important
		// Sort all objects by depth before rendering

		console.time('sort');
		var depth_func =  function(arr){
			return (arr[0]+arr[1]+arr[2]*0.95);
		};
		//World._objects.sort(function(a,b){return depth_func(a.pos) - depth_func(b.pos);});
		
		insertionSort(World._objects, function(a,b){
			return depth_func(a.pos) < depth_func(b.pos);
		});
		console.timeEnd('sort');

		// Limit object visibility thru zfar and znear (relative to camera coordinates)
		var cameradepth = depth_func(World._cameraPos);

		var znear = -30 + cameradepth;
		var zfar =   30 + cameradepth;
		
		// Find boundary indexes thru binary search
		
		var znearindex = 0;
		var zfarindex = World._objects.length;
		
		znearindex = lower_bound(World._objects, 0, World._objects.length, znear, 
			function(a){return depth_func(a.pos);});
		zfarindex =  lower_bound(World._objects, 0, World._objects.length, zfar, 
			function(a){return depth_func(a.pos);});

		console.time('render actual');
		for(var i = znearindex; i < zfarindex; i++)
		{
			World.drawSingleObject(World._objects[i]);
		}
		console.timeEnd('render actual');
		console.timeEnd('render');
		//console.log('Drew ' + (zfarindex-znearindex+1) + ' objects');
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

		var focus = World2Screen(World._cameraPos);
		var coords = World2Screen(obj.pos);

		coords[0] += 320-focus[0];
		coords[1] += 240-focus[1];
		draw(obj.tiles.g, coords[0], coords[1], g[0],g[1]);
	},

	physicsStep : function()
	{
		console.time('physics');
		World._tree.maybeOptimize();

		for(var iter = 0; iter < World._physicsIterations; iter++)
		{
			// reset forces
			for(var i = 0; i < World._objects.length; i++)
			{
				// gravity
				var obj = World._objects[i];
				obj.force = [0,0,
					(obj.static)?0 : (-0.04*obj.mass/World._physicsIterations)
				];
			}
			
			// Keyboard controlled object gets some force
			if(World._control != null)
			{
				var obj = World._control;
				var d = 0.02;
				var movement = [0,0];
				if(Key.get(KEY_LEFT)){ 
				  movement[0] -= d;
				  movement[1] += d;
				}
				if(Key.get(KEY_RIGHT)){ 
				  movement[0] += d;
				  movement[1] -= d;
				}
				if(Key.get(KEY_UP)){ 
				  movement[0] -= d;
				  movement[1] -= d;
				}
				if(Key.get(KEY_DOWN)){ 
				  movement[0] += d;
				  movement[1] += d;
				}

				obj.force[0] += movement[0] - obj.vel[0]/20;
				obj.force[1] += movement[1] - obj.vel[1]/20;

				if(Key.get(KEY_LEFT) && Key.get(KEY_UP))
					obj.direction = WEST;
				else if(Key.get(KEY_UP) && Key.get(KEY_RIGHT))
					obj.direction = NORTH;
				else if(Key.get(KEY_RIGHT) && Key.get(KEY_DOWN))
					obj.direction = EAST;
				else if(Key.get(KEY_DOWN) && Key.get(KEY_LEFT))
					obj.direction = SOUTH;
				//if(Key.get(KEY_SPACE))
				//  obj.force[2] += 0.2;
			}

			// Sweep-line the objects
			//
			
			// Each object is assigned an unique id for the duration of the loop
			for(var i = 0; i < World._objects.length; i++)
			{
				World._objects[i].id = i;
			}
			// Initialize proxy array
			for(var i = 0 ; i < World._proxy.length; i++)
			{
				var p = World._proxy[i];
				p.d = (p.obj.pos[0]+p.obj.pos[1]+p.obj.pos[2]) + ((p.begin==true)?-0.8:0.8);
			}

			// Sort it
			insertionSort(World._proxy, function(a,b){
				return a.d < b.d;
			});
			
			/* 
				This is the main body of the sweep & prune algorithm
				We also collide to static objects stored in a kd-tree here
			*/

			var objectbuffer = [];
			for(var i = 0; i < World._proxy.length; i++)
			{
				var p = World._proxy[i];
				if(p.begin == false)
				{
					// Remove object from buffer
					delete objectbuffer[p.obj.id];
				}
				else
				{
					var o1 = p.obj;
					for(var other in objectbuffer)
					{
						if(!objectbuffer.hasOwnProperty(other))continue;
						
						var o2 = objectbuffer[other].obj;
						
						if(o1.sensor == true && o2.sensor == true)
							continue;
						World._tryCollideAndResponse(o1,o2);
					}
					// Add object to buffer 
					objectbuffer[p.obj.id] = p;
					
					// Look for nearby static objects, collide
					var statics = World._tree.getObjects(o1.pos, 2);
					for(var a = 0; a < statics.length; a++)
					{
						World._tryCollideAndResponse(o1, statics[a].obj);
					}
				}
			}
			// process links
				for(var i = 0; i < World._links.length; i++)
				{
					var l = World._links[i];
					if(l.o1.sensor == true)
					{
						l.o1.pos[0] = l.o2.pos[0] + l.dpos[0];
						l.o1.pos[1] = l.o2.pos[1] + l.dpos[1];
						l.o1.pos[2] = l.o2.pos[2] + l.dpos[2];
						continue;
					}
					else if(l.o2.sensor == true)
					{
						l.o2.pos[0] = l.o1.pos[0] - l.dpos[0];
						l.o2.pos[1] = l.o1.pos[1] - l.dpos[1];
						l.o2.pos[2] = l.o1.pos[2] - l.dpos[2];
						continue;
					}
					var error = [
						 l.dpos[0]-(l.o2.pos[0]-l.o1.pos[0]),
						 l.dpos[1]-(l.o2.pos[1]-l.o1.pos[1]),
						 l.dpos[2]-(l.o2.pos[2]-l.o1.pos[2])
					];
					var d = 0.55;

					// reduces twitching when error is low
					//if(Math.abs(error[0])+Math.abs(error[1])+Math.abs(error[2]) < 0.2)
						//d /= 2;

					l.o1.force[0] -= error[0]*d;
					l.o1.force[1] -= error[1]*d;
					l.o1.force[2] -= error[2]*d;
					l.o2.force[0] += error[0]*d;
					l.o2.force[1] += error[1]*d;
					l.o2.force[2] += error[2]*d;
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
				
				obj.vel[0] *= 0.97;
				obj.vel[1] *= 0.97;
				obj.vel[2] *= 0.97;

				while(Math.abs(obj.vel[0])>1)obj.vel[0] /= 2;
				while(Math.abs(obj.vel[1])>1)obj.vel[1] /= 2;
				while(Math.abs(obj.vel[2])>1)obj.vel[2] /= 2;
			}
		}
		console.timeEnd('physics');
	},
	_tryCollideAndResponse : function(o1, o2)
	{
		var colldata = World._collide(o1, o2);
		if(colldata != false && o1.sensor != true && o2.sensor != true)
		{

			var normal = colldata[0];
			var displacement = colldata[1];

			var dx = (o2.pos[0]-o1.pos[0])*normal[0];
			var dy = (o2.pos[1]-o1.pos[1])*normal[1];
			var dz = (o2.pos[2]-o1.pos[2])*normal[2];
			var d = dx*dx+dy*dy+dz*dz;
			d = Math.sqrt(d);

			// A precaution that will allow us to bend in any possible
			// direction in case the forces would get too high
			if(d < 0.0001)
			{
				var dx = (o2.pos[0]-o1.pos[0]);
				var dy = (o2.pos[1]-o1.pos[1]);
				var dz = (o2.pos[2]-o1.pos[2]);
				var d = dx*dx+dy*dy+dz*dz;
				d = Math.sqrt(d);
			}
			if(d < 0.0001)
			  d = 0.0001;
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
	},
	// Collide two objects
	// return free axii for collision response and amount of displacement
	// or false if no collision
	// for example [[0,0,1], 0.1] means the two objects have penetrated 0.1 units and will have to be moved outwards eachother on the z axis
	_collide : function(o1, o2)
	{
		// Z-check first:
		if(o1.pos[2]+o1.tiles.c.h < o2.pos[2])
			return false;
		if(o1.pos[2] > o2.pos[2]+o2.tiles.c.h)
			return false;

		// Quick bb-check:
		if(o1.pos[0]+1.1 < o2.pos[0]) return false;
		if(o1.pos[0]-1.1 > o2.pos[0]) return false;
		if(o1.pos[1]+1.1 < o2.pos[1]) return false;
		if(o1.pos[1]-1.1 > o2.pos[1]) return false;

		// Treshold for topdown contact :
		var topdown_distance = Math.min(
			 Math.abs((o1.pos[2]+o1.tiles.c.h)-o2.pos[2]),
			 Math.abs(o1.pos[2]-(o2.pos[2]+o2.tiles.c.h))
		);
		var topdown_treshold = 0.2;
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

			var dx = box.pos[0]-cyl.pos[0];
			var dy = box.pos[1]-cyl.pos[1];
			var dist = box.tiles.c.l/2 + cyl.tiles.c.r;
			// check sides
			if((Math.abs(dx) < dist) && 
			  (Math.abs(dy) < dist))
			{
				if(topdown_distance < topdown_treshold)
				  return [[0,0,1], topdown_distance];

				if(Math.abs(dx) > Math.abs(dy))
					return [[1,0,0], dist-Math.abs(dx)];
				else 
					return [[0,1,0], dist-Math.abs(dy)];
			}
			var d = 0;

			// check corners
			dx = (box.pos[0]-box.tiles.c.l/2-cyl.pos[0]);
			dy = (box.pos[1]-box.tiles.c.l/2-cyl.pos[1]);
			dist = Math.sqrt(dx*dx+dy*dy);
			d = cyl.tiles.c.r - dist;
			if(d > 0) return (topdown_distance<topdown_treshold)?[[0,0,1], topdown_distance]:[[1,1,0], d];
			dx = (box.pos[0]+box.tiles.c.l/2-cyl.pos[0]);
			dy = (box.pos[1]-box.tiles.c.l/2-cyl.pos[1]);
			dist = Math.sqrt(dx*dx+dy*dy);
			d = cyl.tiles.c.r - dist;
			if(d > 0) return (topdown_distance<topdown_treshold)?[[0,0,1], topdown_distance]:[[1,1,0], d];
			dx = (box.pos[0]-box.tiles.c.l/2-cyl.pos[0]);
			dy = (box.pos[1]+box.tiles.c.l/2-cyl.pos[1]);
			dist = Math.sqrt(dx*dx+dy*dy);
			d = cyl.tiles.c.r - dist;
			if(d > 0) return (topdown_distance<topdown_treshold)?[[0,0,1], topdown_distance]:[[1,1,0], d];
			dx = (box.pos[0]+box.tiles.c.l/2-cyl.pos[0]);
			dy = (box.pos[1]+box.tiles.c.l/2-cyl.pos[1]);
			dist = Math.sqrt(dx*dx+dy*dy);
			d = cyl.tiles.c.r - dist;
			if(d > 0) return (topdown_distance<topdown_treshold)?[[0,0,1], topdown_distance]:[[1,1,0], d];
		}
		else if(o1.tiles.c.s == 'box' && o2.tiles.c.s == 'box')
		{
			var dx = o2.pos[0]-o1.pos[0];
			var dy = o2.pos[1]-o1.pos[1];
			var length = o1.tiles.c.l/2+o2.tiles.c.l/2;
			
			if(Math.abs(dx) < length && Math.abs(dy) < length)
			{
				if(Math.abs(dx) > Math.abs(dy))
					return (topdown_distance<topdown_treshold)?[[0,0,1], topdown_distance]:[[1,1,0],length-Math.abs(dx)];
				else
					return (topdown_distance<topdown_treshold)?[[0,0,1], topdown_distance]:[[1,1,0],length-Math.abs(dy)];
			}
		}
		else {
			console.log('Unhandled collision for: ' + o1.tiles.c.s + ' vs ' + o2.tiles.c.s);
		}
		return false;
}
};

