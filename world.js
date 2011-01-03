
World = {
	_physicsIterations: 5,
	_objects: new Array(),
	_nonstatic: new Array(), // lists every moving object for quick access
	_static : new Array(), // same for static objects
	_proxy: new Array, // broadphase sweep & prune proxy array
	_tree: new KDTree(), // KD-Tree for static objects
	_links: new Array(),
	_cameraFocus: null,
	_cameraPos: [0,0,0],
	_objectCounter : 0, // Used to assign unique IDs to new objects
	_depth_func: function(a)
	{
		// Depth formula. Used to calculate depth for each object based on their xyz-coordinates
		return a[0] + a[1] + 1.25 * a[2];
	},
	reset : function()
	{
		World._objects = new Array();
		World._proxy = new Array();
		World._links = new Array();
		World._nonstatic = new Array();
		World._static = new Array();
		World._objectCounter = 0;
		World._cameraFocus = null;
		World._cameraPos = [0,0,0];
		World._tree.reset();
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
			force: [0,0,0],
			mass: 1, // ignored for static objects
			tiles: tiles,
			direction: 0,
			static: static, // partake in dynamics simulation if static=false
			frame: 0, // current frame
			frameTick: 0, // current tick
			frameMaxTicks: 1, // ticks to reach until we switch to next frame (0 to disable animation)
			id: World._objectCounter++ // Unique id is assigned to each object
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
			// And can be accessed quickly thru a separate array as well
			World._nonstatic.push(obj); 
		}
		else {
			// Whereas static objects go to a large kd-tree for collision testing
			World._tree.insert({pos: pos, obj: obj});

			//debugger;
			// ... And to their own quick-access array
			// Strangely, it's at least 10x faster to sort the array with insertion sort
			// every time an object is added than to binary search and insert
			World._static.push(obj);
			insertionSort(World._static, function(a,b){
				return World._depth_func(a.pos) < World._depth_func(b.pos);
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
			dpos : [o2.pos[0]-o1.pos[0],o2.pos[1]-o1.pos[1],o2.pos[2]-o1.pos[2]]
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
			World._cameraPos[0] = World._cameraFocus.pos[0];
			World._cameraPos[1] = World._cameraFocus.pos[1];
			World._cameraPos[2] = World._cameraFocus.pos[2];
		}

		World.drawBackground();

		// Drawing order is important
		// Sort all nonstatic objects by depth before rendering

		//console.time('sort');
		
		//insertionSort(World._static, function(a,b){
		//	return World._depth_func(a.pos) < World._depth_func(b.pos);
		//});
		insertionSort(World._nonstatic, function(a,b){
			return World._depth_func(a.pos) < World._depth_func(b.pos);
		});
		//console.timeEnd('sort');

		// Limit object visibility thru zfar and znear (relative to camera coordinates)
		var cameradepth = World._depth_func(World._cameraPos);

		var znear = -30 + cameradepth;
		var zfar =   30 + cameradepth;
		
		// Find boundary indexes from static objs thru binary search
		
		var znearindex = 0;
		var zfarindex = World._static.length;
		
		znearindex = lower_bound(World._static, 0, World._static.length, znear, 
			function(a){return World._depth_func(a.pos);});
		zfarindex =  lower_bound(World._static, 0, World._static.length, zfar, 
			function(a){return World._depth_func(a.pos);});

		if(znearindex == -1)znearindex = 0;
		if(zfarindex == -1)zfarindex = World._static.length;

		// For each nonstatic object, find an index on static objects

		// TODO This is naive, we can do better
		//console.time('mapping');
		var indices = [];
		for(var i = 0; i < World._nonstatic.length; i++)
		{
			var d = World._depth_func(World._nonstatic[i].pos);
			indices.push(
				lower_bound(World._static, 0, World._static.length, d,
					function(a){return World._depth_func(a.pos);})
			);
		}
		//console.timeEnd('mapping');
		
		//console.time('traversing');
		// Traverse those indices
		//
		var currentpos = 0;

		// Skip till first nonstatic...
		while(currentpos < World._static.length && indices[currentpos] < znearindex)currentpos++;

		// Start drawing statics primarily, nonstatics as we bump into them
		for(var i = znearindex; i < zfarindex; i++)
		{
			while(currentpos < World._static.length && indices[currentpos] == i)
			{
				World.drawSingleObject(World._nonstatic[currentpos]);
				currentpos++;
			}
			World.drawSingleObject(World._static[i]);
		}
		// Render rest of nonstatics
		for(var i = currentpos; i < World._nonstatic.length; i++)
		{
			World.drawSingleObject(World._nonstatic[i]);
			if(World._depth_func(World._nonstatic[i].pos) > zfar)
				break;
		}

		//console.timeEnd('traversing');
		/*for(var i = znearindex; i < zfarindex; i++)
		{
			World.drawSingleObject(World._static[i]);
		}*/
		//console.timeEnd('render');
		//console.log('Drew ' + (zfarindex-znearindex+1) + ' objects (out of '+World._objects.length+')');
	},
	drawBackground : function()
	{
		// Clears the screen with a suitable color, renders clouds, etc.
			
		// Update world sky color based on camera position
		var r,g,b;
		var h = World._cameraPos[2];
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

		//Graphics.ctx.globalAlpha = 1.0;
		
		// Clear with sky color
		Graphics.ctx.fillRect (0, 0, 640, 480);		
		//Graphics.ctx.globalAlpha = 0.5;
		
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
			var camerapos = World2Screen(World._cameraPos);
	
			// Calculate alpha for clouds
			Graphics.ctx.globalAlpha = cloud_alpha;
	
			// Filenames and offsets I made up
			var clouds = [
				['cloud1.png', 800, 200],
				['cloud2.png', 200, 600],
				['cloud3.png', 10, 300],
				['cloud4.png', 500, 100],
				['cloud5.png', 800, 400],
			];
			function clampwrap(x, loop){/*x -= loop*Math.floor(x/loop); } //*/while(x<0)x+= loop; return x % loop;}
			for(var i = 0; i < clouds.length; i++)
			{
				Graphics.ctx.drawImage(
					Graphics.img[clouds[i][0]], 
					clampwrap(clouds[i][1]-camerapos[0],640*2)-320,
					clampwrap(clouds[i][2]-camerapos[1],480*2)-240);
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

		var focus = World2Screen(World._cameraPos);
		var coords = World2Screen(obj.pos);

		coords[0] += 320-focus[0];
		coords[1] += 240-focus[1];
		draw(coords[0], coords[1], g[0],g[1]);
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

						// Collide with the other dynamic object
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
					var error = [
						 l.dpos[0]-(l.o2.pos[0]-l.o1.pos[0]),
						 l.dpos[1]-(l.o2.pos[1]-l.o1.pos[1]),
						 l.dpos[2]-(l.o2.pos[2]-l.o1.pos[2])
					];
					var d = 1.1;

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
			for(var i = 0; i < World._nonstatic.length; i++)
			{
				var obj = World._nonstatic[i];
				obj.vel[0] += obj.force[0]/obj.mass;
				obj.vel[1] += obj.force[1]/obj.mass;
				obj.vel[2] += obj.force[2]/obj.mass;
				obj.pos[0] += obj.vel[0]/World._physicsIterations;
				obj.pos[1] += obj.vel[1]/World._physicsIterations;
				obj.pos[2] += obj.vel[2]/World._physicsIterations;
				
				obj.vel[0] *= 0.99;
				obj.vel[1] *= 0.99;
				obj.vel[2] *= 0.99;

				//while(Math.abs(obj.vel[0])>1)obj.vel[0] /= 2;
				//while(Math.abs(obj.vel[1])>1)obj.vel[1] /= 2;
				//while(Math.abs(obj.vel[2])>1)obj.vel[2] /= 2;
			}
			// reset forces & set gravity ready for next round
			for(var i = 0; i < World._nonstatic.length; i++)
			{
				var obj = World._nonstatic[i];
				obj.force = [0,0, -0.04*obj.mass/World._physicsIterations];
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

			var normal = colldata[0];
			var displacement = colldata[1];
			
			var force = [
				normal[0]*displacement,
				normal[1]*displacement,
				normal[2]*displacement
				];
			
			// Alert possible collision listeners and see if they want to cancel it
			var cancel = false;
			for(var i = 0; i < 2; i++)
			{
				var cur   = i==0?o1:o2;
				var other = i==0?o2:o1;
				if(cur.collision_listener)
				{
					var mul = i==0?1:-1;
					var ret = cur.collision_listener(cur, other, [normal[0]*mul,normal[1]*mul,normal[2]*mul], displacement);
					if(ret == false)
					{
						cancel = true;
					}
					else if(ret.length)
					{
						force[0] -= ret[0] * mul;
						force[1] -= ret[1] * mul;
						force[2] -= ret[2] * mul;
					}
				}
			}

			for(var i = 0; i < 3; i++)
			{
				o1.force[i] += force[i];
				o2.force[i] -= force[i];
/*				
				if(!o1.static && !o2.static)
				{
					o1.pos[i] += force[i]*(o2.mass/(o1.mass+o2.mass));
					o2.pos[i] -= force[i]*(o1.mass/(o1.mass+o2.mass));
				}
				else if(o1.static)
				{
					o2.pos[i] -= force[i];
				}
				else if(o2.static)
				{
					o1.pos[i] += force[i];
				}*/
			}
			

			var mean = [
				o1.vel[0]*o1.mass + o2.vel[0]*o2.mass,
				o1.vel[1]*o1.mass + o2.vel[1]*o2.mass,
				o1.vel[2]*o1.mass + o2.vel[2]*o2.mass
				];

			mean[0] /= o1.mass + o2.mass;
			mean[1] /= o1.mass + o2.mass;
			mean[2] /= o1.mass + o2.mass;

			// Velocities should equal each other on the axis defined by normal
			// Easy.
			for(var i = 0; i < 3; i++)
			{
				o1.vel[i] = o1.vel[i]+(mean[i]-o1.vel[i])*Math.abs(normal[i]);
				o2.vel[i] = o2.vel[i]+(mean[i]-o2.vel[i])*Math.abs(normal[i]);
			}
		}
	},
	// Collide two objects
	// return false if no collision
	// otherwise return [collision plane normal vector, amount of displacement]
	// for example [[0,0,1], 0.1] means the two objects have penetrated 0.1 units and will have to be moved outwards eachother on the z axis
	_collide : function(o1, o2)
	{
		// Quick bounding volume checks to rule obvious cases out:
		if(o1.pos[2]+o1.tiles.c.h < o2.pos[2])
			return false;
		if(o1.pos[2] > o2.pos[2]+o2.tiles.c.h)
			return false;
		if(o1.pos[0]+1.1 < o2.pos[0]) return false;
		if(o1.pos[0]-1.1 > o2.pos[0]) return false;
		if(o1.pos[1]+1.1 < o2.pos[1]) return false;
		if(o1.pos[1]-1.1 > o2.pos[1]) return false;

		// Distance to move the objects on top of eachother< :
		var topdown_distance = Math.min(
			 Math.abs((o1.pos[2]+o1.tiles.c.h)-o2.pos[2]),
			 Math.abs(o1.pos[2]-(o2.pos[2]+o2.tiles.c.h))
		);
		// determine which of the objs is on top..
		var topdown_normal = [0,0,
			((o1.pos[2]+o1.tiles.c.h/2) > (o2.pos[2]+o2.tiles.c.h/2))?1:-1];

		var collided = false;
		var ret = [topdown_normal, topdown_distance];

		function apply(current, candidate)
		{
			if(candidate[1] < current[1])
			{
				current[0] = candidate[0];
				current[1] = candidate[1];
			}
		}

		// XY-check:
		if(o1.tiles.c.s == 'cylinder' && o2.tiles.c.s == 'cylinder')
		{
			var d = 
				Math.sqrt(
				 (o1.pos[0]-o2.pos[0])*(o1.pos[0]-o2.pos[0])+
				 (o1.pos[1]-o2.pos[1])*(o1.pos[1]-o2.pos[1])
				);
			if(d < (o1.tiles.c.r + o2.tiles.c.r))
			{
				// calculate normal + normalize it
				var normal = [o1.pos[0]-o2.pos[0],o1.pos[1]-o2.pos[1],0];
				var len = Math.sqrt(normal[0]*normal[0]+normal[1]*normal[1]);
				normal[0] /= len;
				normal[1] /= len;
				apply(ret, [normal, o1.tiles.c.r+o2.tiles.c.r-d]);
				collided = true;
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
				if(Math.abs(dx) > Math.abs(dy))
				{
					apply(ret, [[(o1.pos[0]>o2.pos[0])?1:-1,0,0], dist-Math.abs(dx)]);
				}
				else 
				{
					apply(ret, [[0,(o1.pos[1]>o2.pos[1])?1:-1,0], dist-Math.abs(dy)]);
				}
				collided = true;
			}
			
			var d = 0;

			// check corners
			var corners = [[1,1],[-1,1],[1,-1],[-1,-1]];
			for(var i = 0; i < 4; i++)
			{
				var xmul = corners[i][0];
				var ymul = corners[i][1];
				
				var corner = [
					box.pos[0] + xmul*box.tiles.c.l/2,
					box.pos[1] + ymul*box.tiles.c.l/2
				];
				
				dx = corner[0] - cyl.pos[0];
				dy = corner[1] - cyl.pos[1];
				
				dist = Math.sqrt(dx*dx+dy*dy);
				
				d = cyl.tiles.c.r - dist;
				
				if(d > 0)
				{
				 	var mul = (o1.id == box.id)?1:-1;
					apply(ret, [[mul*dx/dist, mul*dy/dist, 0], d]);
					collided = true;
				}
			}
		}
		else if(o1.tiles.c.s == 'box' && o2.tiles.c.s == 'box')
		{
			var dx = o2.pos[0]-o1.pos[0];
			var dy = o2.pos[1]-o1.pos[1];
			var length = o1.tiles.c.l/2+o2.tiles.c.l/2;
			
			if(Math.abs(dx) < length && Math.abs(dy) < length)
			{
				if(Math.abs(dx) > Math.abs(dy))
				{
					apply(ret, [[o1.pos[0]>o2.pos[0]?1:-1,0,0],length-Math.abs(dx)]);
				}
				else
				{
					apply(ret, [[0,o1.pos[1]>o2.pos[1]?1:-1,0],length-Math.abs(dy)]);
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

