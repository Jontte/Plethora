
World = {
	_physicsIterations: 5,
	_objects: [],
	_mobile: [], // lists every moving object for quick access
	_fixed : [], // same for fixed objects
	_proxy: [], // broadphase sweep & prune proxy array
	_tree: new KDTree(), // KD-Tree for static objects
	_links: [],
	_cameraFocus: null,
	_cameraPosX: 0,
	_cameraPosY: 0,
	_cameraPosZ: 0,
	_objectCounter : 0, // Used to assign unique IDs to new objects
	_depth_func: function(x,y,z)
	{
		// Depth formula. Used to calculate depth for each object based on their xyz-coordinates
		return x + y + 1.25 * z;
	},
	reset : function()
	{
		World._objects = [];
		World._proxy = [];
		World._links = [];
		World._mobile = [];
		World._fixed = [];
		World._objectCounter = 0;
		World._cameraFocus = null;
		World._cameraPosX = 0;
		World._cameraPosY = 0;
		World._cameraPosZ = 0;
		World._tree.reset();
	},
	setCameraFocus : function(obj)
	{
		World._cameraFocus = obj;
	},
	createObject : function(tiles, x, y, z, fixed)
	{
		if(fixed==undefined)
			fixed = true;
		
		var obj = new World.Entity(tiles, x, y, z, fixed);

		// Physics shape defaults to 1x1x1 box:
		if(tiles.c == undefined)
			tiles.c = {s:'box', h:1, l:1};

		World._objects.push(obj);

		if(fixed==false)
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
			// And can be accessed quickly thru a separate array as well
			World._mobile.push(obj); 
		}
		else {
			// Whereas fixed objects go to a large kd-tree for collision testing
			World._tree.insert({pos: [x,y,z], obj: obj});

			// ... And to their own quick-access array
			// Strangely, it's at least 10x faster to sort the array with insertion sort
			// every time an object is added than to binary search and insert
			World._fixed.push(obj);
			insertionSort(World._fixed, function(a,b){
				return World._depth_func(a.x, a.y, a.z) < World._depth_func(b.x, b.y, b.z);
			});
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
			dx : o2.x-o1.x, 
			dy : o2.y-o1.y,
			dz : o2.z-o1.z
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
		//console.time('render');

		// Update camera position
		if(World._cameraFocus != null)
		{
			World._cameraPosX = World._cameraFocus.x;
			World._cameraPosY = World._cameraFocus.y;
			World._cameraPosZ = World._cameraFocus.z;
		}

		World.drawBackground();

		// Drawing order is important
		// Sort all mobile objects by depth before rendering

		//console.time('sort');
		
		insertionSort(World._mobile, function(a,b){
			return World._depth_func(a.x,a.y,a.z) < World._depth_func(b.x,b.y,b.z);
		});
		//console.timeEnd('sort');

		// Limit object visibility thru zfar and znear (relative to camera coordinates)
		var cameradepth = World._depth_func(
			World._cameraPosX,
			World._cameraPosY,
			World._cameraPosZ
			);

		var znear = -30 + cameradepth;
		var zfar =   30 + cameradepth;
		
		// Find boundary indexes from fixed objs thru binary search
		
		var znearindex = 0;
		var zfarindex = World._fixed.length;
		
		znearindex = lower_bound(World._fixed, 0, World._fixed.length, znear, 
			function(a){return World._depth_func(a.x, a.y, a.z);});
		zfarindex =  lower_bound(World._fixed, 0, World._fixed.length, zfar, 
			function(a){return World._depth_func(a.x, a.y, a.z);});

		if(znearindex == -1)znearindex = 0;
		if(zfarindex == -1)zfarindex = World._fixed.length;

		// For each mobile object, find an index on fixed objects' array

		// TODO This is naive, we can do better
		//console.time('mapping');
		var indices = [];
		for(var i = 0; i < World._mobile.length; i++)
		{
			var obj = World._mobile[i];
			var d = World._depth_func(obj.x, obj.y, obj.z);
			indices.push(
				lower_bound(World._fixed, 0, World._fixed.length, d,
					function(a){return World._depth_func(a.x, a.y, a.z);})
			);
		}
		//console.timeEnd('mapping');
		
		//console.time('traversing');
		// Traverse those indices
		//
		var currentpos = 0;

		// Skip till first mobile...
		while(currentpos < World._fixed.length && indices[currentpos] < znearindex)currentpos++;

		// Start drawing fixeds primarily, mobiles as we bump into them
		for(var i = znearindex; i < zfarindex; i++)
		{
			while(currentpos < World._fixed.length && indices[currentpos] == i)
			{
				World.drawSingleObject(World._mobile[currentpos]);
				currentpos++;
			}
			World.drawSingleObject(World._fixed[i]);
		}
		// Render rest of mobiles
		for(var i = currentpos; i < World._mobile.length; i++)
		{
			var o = World._mobile[i];
			World.drawSingleObject(o);
			if(World._depth_func(o.x, o.y, o.z) > zfar)
				break;
		}

		//console.timeEnd('traversing');
		/*for(var i = znearindex; i < zfarindex; i++)
		{
			World.drawSingleObject(World._fixed[i]);
		}*/
		//console.timeEnd('render');
		//console.log('Drew ' + (zfarindex-znearindex+1) + ' objects (out of '+World._objects.length+')');
	},
	drawBackground : function()
	{
		// Clears the screen with a suitable color, renders clouds, etc.
			
		// Update world sky color based on camera position
		var r,g,b;
		var h = World._cameraPosZ;
		// Color at zero height
		var midpoint = [96,127,255];
		var edges = [-50, 100];
		
		cloud_alpha = Math.min(1, Math.max(0, 5*(1-1*Math.abs((h-25)/50))));
		star_alpha = Math.min(1, Math.max(0, (h-40)/20));

		if(h > 0) {
			if(h>edges[1])h=edges[1];
			r = midpoint[0]+(0-midpoint[0])*(h/edges[1]);
			g = midpoint[1]+(0-midpoint[1])*(h/edges[1]);
			b = midpoint[2]+(0-midpoint[2])*(h/edges[1]);
		}
		else {
			if(h<edges[0])h=edges[0];
			r = midpoint[0]+(0-midpoint[0])*(h/edges[0]);
			g = midpoint[1]+(0-midpoint[1])*(h/edges[0]);
			b = midpoint[2]+(64-midpoint[2])*(h/edges[0]);
		}
		r=Math.floor(r);
		g=Math.floor(g);
		b=Math.floor(b);

		// Change sky color
		Graphics.ctx.fillStyle = 'rgb('+r+','+g+','+b+')';

		// Clear with sky color
		Graphics.ctx.fillRect (0, 0, 640, 480);		
		
		// Draw stars
		if(star_alpha > 0.001)
		{
			Graphics.ctx.globalAlpha = star_alpha;
			Graphics.ctx.fillStyle = Graphics.ctx.createPattern(Graphics.img['stars.png'], 'repeat');
			Graphics.ctx.fillRect (0, 0, 640, 480);		
			Graphics.ctx.globalAlpha = 1.0;
		}
		// Draw wrapping clouds. We can skip drawing altogether if alpha = 0
		if(cloud_alpha > 0.001)
		{
			var camerapos = World2Screen(World._cameraPosX, World._cameraPosY, World._cameraPosZ);
	
			// Calculate alpha for clouds
			Graphics.ctx.globalAlpha = cloud_alpha;
	
			// Filenames and offsets I made up
			var clouds = [
				['cloud1.png', 800, 200],
				['cloud2.png', 200, 600],
				['cloud3.png', 10, 300],
				['cloud4.png', 500, 100],
				['cloud5.png', 800, 400]
			];
			function clampwrap(x, loop){while(x<0)x+= loop; return x % loop;}
			for(var i = 0; i < clouds.length; i++)
			{
				Graphics.ctx.drawImage(
					Graphics.img[clouds[i][0]], 
					clampwrap(clouds[i][1]-camerapos.x,640*2)-320,
					clampwrap(clouds[i][2]-camerapos.y,480*2)-240);
			}
			Graphics.ctx.globalAlpha = 1.0;
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
			if(obj.frameTick >= Math.abs(obj.frameMaxTicks) && obj.frameMaxTicks != 0)
			{
				obj.frameTick = 0;
				if(obj.tiles.t & ANIMATED_RANDOM)
				{
					obj.frame = Math.floor(Math.random() * g.length);
				}
				else
				{
					if(obj.frameMaxTicks < 0) // inverse animation
						obj.frame = (obj.frame-1<0)?g.length-1:obj.frame-1;
					else
						obj.frame = (obj.frame+1) % g.length;
				}
			}
			g = g[obj.frame];
		}

		var focus = World2Screen(World._cameraPosX, World._cameraPosY, World._cameraPosZ);
		var coords = World2Screen(obj.x, obj.y, obj.z);

		coords.x += 320-focus.x;
		coords.y += 240-focus.y;
		draw(coords.x, coords.y, g[0] ,g[1]);
	},

	physicsStep : function()
	{
		//console.time('physics');
		World._tree.maybeOptimize();

		for(var iter = 0; iter < World._physicsIterations; iter++)
		{
			// Sweep-line the objects
			//
			
			// Initialize proxy array
			for(var i = 0 ; i < World._proxy.length; i++)
			{
				var p = World._proxy[i];
				// That magical value 0.8 comes from sqrt(1+1+1)/2 aka half space diagonal of a cube
				p.d = (p.obj.x + p.obj.y + p.obj.z) + ((p.begin==true)?-0.8:0.8);
			}

			// Sort it
			insertionSort(World._proxy, function(a,b){
				return a.d < b.d;
			});
			
			/* 
				This is the main body of the sweep & prune algorithm
				We also collide to fixed objects stored in a kd-tree here
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

						// Collide with the other dynamic object
						World._tryCollideAndResponse(o1,o2);
					}
					// Add object to buffer 
					objectbuffer[p.obj.id] = p;
					
					// Look for nearby fixed objects, collide
					var fixeds = World._tree.getObjects([o1.x, o1.y, o1.z], 2);
					for(var a = 0; a < fixeds.length; a++)
					{
						World._tryCollideAndResponse(o1, fixeds[a].obj);
					}
				}
			}
			// process links
				for(var i = 0; i < World._links.length; i++)
				{
					var l = World._links[i];
					var o1 = l.o1;
					var o2 = l.o2;
					var errorx = l.dx-(o2.x-o1.x);
					var errory = l.dy-(o2.y-o1.y);
					var errorz = l.dz-(o2.z-o1.z);
					var d = 1.1;

					o1.fx -= errorx*d;
					o1.fy -= errory*d;
					o1.fz -= errorz*d;
					o2.fx += errorx*d;
					o2.fy += errory*d;
					o2.fz += errorz*d;
				}
			// euler integrate
			for(var i = 0; i < World._mobile.length; i++)
			{
				var obj = World._mobile[i];
				obj.vx += obj.fx/obj.mass;
				obj.vy += obj.fy/obj.mass;
				obj.vz += obj.fz/obj.mass;
				obj.x += obj.vx/World._physicsIterations;
				obj.y += obj.vy/World._physicsIterations;
				obj.z += obj.vz/World._physicsIterations;
				
				obj.vx *= 0.99;
				obj.vy *= 0.99;
				obj.vz *= 0.99;
			}
			// reset forces & set gravity ready for next round
			for(var i = 0; i < World._mobile.length; i++)
			{
				var obj = World._mobile[i];
				obj.fx = 0;
				obj.fy = 0;
				obj.fz = -0.04*obj.mass/World._physicsIterations;
			}
		}
		//console.timeEnd('physics');
	},
	_tryCollideAndResponse : function(o1, o2)
	{
		var colldata = World._collide(o1, o2);
		if(colldata != false)
		{
			// It's a HIT!
			// Copy normal
			var nx = colldata.nx;
			var ny = colldata.ny;
			var nz = colldata.nz;
			var displacement = colldata.displacement;
			
			var fx = nx * displacement;
			var fy = ny * displacement;
			var fz = nz * displacement;
			
			// Alert possible collision listeners, that can either:
			// - cancel the collision
			// - calculate surface velocity (conveyor belt)
			// - do nothing

			var cancel = false;
			var vx = 0;
			var vy = 0;
			var vz = 0;
			for(var i = 0; i < 2; i++)
			{
				var cur   = i==0?o1:o2;
				var other = i==0?o2:o1;
				if(cur.collision_listener)
				{
					var mul = i==0?1:-1;
					var ret = cur.collision_listener(cur, other, nx*mul, ny*mul, nz*mul, displacement);
					if(ret == false)
					{
						cancel = true;
					}
					else if(ret.vx != undefined)
					{
						vx += ret.vx * mul;
						vy += ret.vy * mul;
						vz += ret.vz * mul;
					}
				}
			}
			if(vx!=0||vy!=0||vz!=0)
			{
				fx -= vx/20 + (o1.vx-o2.vx)/50;
				fy -= vy/20 + (o1.vy-o2.vy)/50;
				fz -= vz/20 + (o1.vz-o2.vz)/50;
			}
			o1.fx += fx;
			o1.fy += fy;
			o1.fz += fz;
			o2.fx -= fx;
			o2.fy -= fy;
			o2.fz -= fz;
		
			// mean
			var mx = 0;
			var my = 0;
			var mz = 0;

			if(!o1.fixed && !o2.fixed)
			{
				mx = o1.vx*o1.mass + o2.vx*o2.mass;
				my = o1.vy*o1.mass + o2.vy*o2.mass;
				mz = o1.vz*o1.mass + o2.vz*o2.mass;

				mx /= o1.mass + o2.mass;
				my /= o1.mass + o2.mass;
				mz /= o1.mass + o2.mass;
			}

			// Velocities should equal each other on the axis defined by normal
			// Easy
			// a+(b-a)*c, linear combination
			
			o1.vx = o1.vx+(mx-o1.vx)*Math.abs(nx);
			o1.vy = o1.vy+(my-o1.vy)*Math.abs(ny);
			o1.vz = o1.vz+(mz-o1.vz)*Math.abs(nz);
			o2.vx = o2.vx+(mx-o2.vx)*Math.abs(nx);
			o2.vy = o2.vy+(my-o2.vy)*Math.abs(ny);
			o2.vz = o2.vz+(mz-o2.vz)*Math.abs(nz);
		}
	},
	// Collide two objects
	// return false if no collision
	// otherwise return [collision plane normal vector, amount of displacement]
	// for example [[0,0,1], 0.1] means the two objects have penetrated 0.1 units and will have to be moved outwards eachother on the z axis
	_collide : function(o1, o2)
	{
		// Quick bounding volume checks to rule obvious cases out:
		if(o1.z+o1.tiles.c.h < o2.z)
			return false;
		if(o1.z > o2.z+o2.tiles.c.h)
			return false;
		if(o1.x+1.1 < o2.x) return false;
		if(o1.x-1.1 > o2.x) return false;
		if(o1.y+1.1 < o2.y) return false;
		if(o1.y-1.1 > o2.y) return false;

		// Distance to move the objects on top of eachother 
		var topdown_distance = Math.min(
			 Math.abs((o1.z+o1.tiles.c.h)-o2.z),
			 Math.abs(o1.z-(o2.z+o2.tiles.c.h))
		);
		// determine which of the objs is on top..
		var topdown_normal = ((o1.z+o1.tiles.c.h/2) > (o2.z+o2.tiles.c.h/2))?1:-1;

		var collided = false;
		var ret = {
			nx: 0,
			ny: 0,
			nz: topdown_normal, 
			displacement: topdown_distance
		};

		// Function used to update the best candidate normal and displacement
		// Note, ret is only returned when collision is verified (collided=true)
		function apply(current, candidate)
		{
			if(candidate.displacement < current.displacement)
			{
				// Enable stepping. This two-line addition disables fine xy-plane collisions
				// If we only have to jump less than 0.2 units to satisfy vertical collision
				if(current.nz>0.99 && current.displacement < 0.2)
					return;
				current.nx = candidate.nx;
				current.ny = candidate.ny;
				current.nz = candidate.nz;
				current.displacement = candidate.displacement;
			}
		}

		// XY-check:
		if(o1.tiles.c.s == 'cylinder' && o2.tiles.c.s == 'cylinder')
		{
			var d = 
				Math.sqrt(
				 (o1.x-o2.x)*(o1.x-o2.x)+
				 (o1.y-o2.y)*(o1.y-o2.y)
				);
			if(d < (o1.tiles.c.r + o2.tiles.c.r))
			{
				// calculate normal + normalize it
				var nx = o1.x-o2.x;
				var ny = o1.y-o2.y;
				var nz = 0;
				var len = Math.sqrt(nx*nx+ny*ny+nz*nz);
				nx /= len;
				ny /= len;
				nz /= len;
				apply(ret, {nx: nx, ny: ny, nz: nz, 
					displacement: o1.tiles.c.r+o2.tiles.c.r-d});
				collided = true;
			}
		}
		else if((o1.tiles.c.s == 'cylinder' && o2.tiles.c.s == 'box')
		|| (o1.tiles.c.s == 'box' && o2.tiles.c.s == 'cylinder'))
		{
			var box = (o1.tiles.c.s=='cylinder')?o2:o1;
			var cyl = (o1.tiles.c.s=='cylinder')?o1:o2;

			var dx = box.x-cyl.x;
			var dy = box.y-cyl.y;
			var dist = box.tiles.c.l/2 + cyl.tiles.c.r;

			// check sides
			if((Math.abs(dx) < dist) && Math.abs(dy) < box.tiles.c.l/2)
			{
				apply(ret, {nx: (o1.x>o2.x)?1:-1, ny: 0, nz: 0, displacement: dist-Math.abs(dx)});
				collided = true;
			}
			else if((Math.abs(dy) < dist) && Math.abs(dx) < box.tiles.c.l/2)
			{
				apply(ret, { nx: 0, ny: (o1.y>o2.y)?1:-1, nz: 0, displacement: dist-Math.abs(dy)});
				collided = true;
			}
			else
			{
				var d = 0;
	
				// check corners
				var corners = [[1,1],[-1,1],[1,-1],[-1,-1]];
				for(var i = 0; i < 4; i++)
				{
					var xmul = corners[i][0];
					var ymul = corners[i][1];
					
					var corner = [
						box.x + xmul*box.tiles.c.l/2,
						box.y + ymul*box.tiles.c.l/2
					];
					
					dx = corner[0] - cyl.x;
					dy = corner[1] - cyl.y;
					
					dist = Math.sqrt(dx*dx+dy*dy);
					
					d = cyl.tiles.c.r - dist;
					
					if(d > 0)
					{
					 	var mul = (o1.id == box.id)?1:-1;
						apply(ret, {nx: mul*dx/dist, ny: mul*dy/dist, nz: 0, displacement: d});
						collided = true;
					}
				}
			}
		}
		else if(o1.tiles.c.s == 'box' && o2.tiles.c.s == 'box')
		{
			var dx = o2.x-o1.x;
			var dy = o2.y-o1.y;
			var length = o1.tiles.c.l/2+o2.tiles.c.l/2;
			
			if(Math.abs(dx) < length && Math.abs(dy) < length)
			{
				if(Math.abs(dx) > Math.abs(dy))
				{
					apply(ret, {nx: o1.x>o2.x?1:-1, ny: 0, nz: 0, displacement: length-Math.abs(dx)});
				}
				else
				{
					apply(ret, {nx: 0, ny: o1.y>o2.y?1:-1, nz: 0, displacement: length-Math.abs(dy)});
				}
				collided = true;
			}
		}
		else {
			console.log('Unhandled collision for: ' + o1.tiles.c.s + ' vs ' + o2.tiles.c.s);
		}
		if(collided)
			return ret;
		return false;
}
};


World.Entity = function(tiles, x, y, z, fixed)
{
	this.x = x; // position
	this.y = y;
	this.z = z;
	this.tiles = tiles;
	this.fixed = fixed; // take part in dynamics simulation if fixed=false
	this.id = World._objectCounter++; // Unique id is assigned to each object
}

World.Entity.prototype.vx = 0; // velocity
World.Entity.prototype.vy = 0;
World.Entity.prototype.vz = 0;
World.Entity.prototype.fx = 0; // force
World.Entity.prototype.fy = 0;
World.Entity.prototype.fz = 0;
World.Entity.prototype.mass = 1;
World.Entity.prototype.direction = 0;
World.Entity.prototype.frame = 0; // current frame
World.Entity.prototype.frameTick = 0; // current tick
World.Entity.prototype.frameMaxTicks = 1; // ticks to reach until we switch to next frame (0 to disable animation)

