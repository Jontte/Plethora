World = {
	/* 
	 * Constants
	 */
	
	// Directions
	NORTH 	: 0,
	EAST 	: 1,
	SOUTH 	: 2,
	WEST 	: 3,
	
	// Frame flags
	DIRECTED 		: 1, // Tiles that have separate frames for separate facing directions
	ANIMATED 		: 2, // Tiles that can be animated
	ANIMATED_RANDOM : 4, // .. with random frame order
	
	// Shape enum
	BOX: 0,
	CYLINDER : 1,
	SLOPE: 2,
	
	/* 
	 * Internal variables 
	 */
	_physicsIterations: 5,
	_objects: [],
	_mobile: [], // lists every moving object for quick access
	_fixed : [], // same for fixed objects
	_proxy: [], // broadphase sweep & prune proxy array
	_tree: new jsBIH(3), // Tree structure for static objects
	_renderProxy: [], // proxy objects for separate sweep&prune used in rendering
	_links: [],
	_cameraFocus: null,
	_cameraPosX: 0,
	_cameraPosY: 0,
	_cameraPosZ: 0,
	_objectCounter : 0, // Used to assign unique IDs to new objects
	_colliders: {}, // an array for collision handler functions
	_classes: {}, // All loaded classes
	_modules: {}, // All loaded modules
	_level: '', // Name of currently loaded level
	_editor: {
		online: false, // Whether we're in editor mode or not
		proxy: [] // Separate object collision proxy for all objects in editor mode
	},
	mouseX: 0,
	mouseY: 0,
	background: { // Background rendering
		scene : new Effects.SunsetBackground(0,0,640,480),
		clouds: []
	},
	preload: {}, // uri-mapped Image objects. Used to preload graphics before starting level
	_depth_func: function(a,b)
	{
		/*
			This function is the root of the render graph builder.
			It answers the following question:
			"Is a behind b?" or "Should a be rendered before b?"
			Returns null when don't care
		*/
		
		// check diagonals..
		var mx = (a.bx+b.bx)/2;
		var my = (a.by+b.by)/2;
		var mz = (a.bz+b.bz)/2;
		
		var p1a = (a.x-b.x)-mx >= 0;
		var p2a = (a.y-b.y)-my >= 0;
		var p3a = (a.z-b.z)-mz >= 0;
			
		var p1b = (a.x-b.x)+mx <= 0;
		var p2b = (a.y-b.y)+my <= 0;
		var p3b = (a.z-b.z)+mz <= 0; 
		
		// we always prefer nulls where possible since adding unnecessary 
		// connections to the rendering graph can potentially make 
		// calculation much more complicated and expensive
		
		if(p1a&&p2b)return null;
		if(p2a&&p1b)return null;
		
		if(p3b)
			if(p1a||p2a)return null;
		if(p3a)
			if(p2b||p1b)return null;
		
		if(p1a)return false;
		if(p1b)return true;
		if(p2a)return false;
		if(p2b)return true;
		if(p3a)return false;
		if(p3b)return true;

		// If the objects penetrate just a little, we may still be able to do something...
		// calculate box of penetration.. 
		
		var bbx1 = a.x-a.bx/2;
		var bby1 = a.y-a.by/2;
		var bbz1 = a.z-a.bz/2;
		var bbx2 = a.x+a.bx/2;
		var bby2 = a.y+a.by/2;
		var bbz2 = a.z+a.bz/2;
		
		if(b.x-b.bx/2 > bbx1)
			bbx1 = b.x-b.bx/2;
		if(b.y-b.by/2 > bby1)
			bby1 = b.y-b.by/2;
		if(b.z-b.bz/2 > bbz1)
			bbz1 = b.z-b.bz/2;
		
		if(b.x+b.bx/2 < bbx2)
			bbx2 = b.x+b.bx/2;
		if(b.y+b.by/2 < bby2)
			bby2 = b.y+b.by/2;
		if(b.z+b.bz/2 < bbz2)
			bbz2 = b.z+b.bz/2;
			
		// select dimension that penerates least => sort by that dim
		
		var bbx = bbx2-bbx1;
		var bby = bby2-bby1;
		var bbz = bbz2-bbz1;
		
		if(	bbx < bby && 
			bbx < bbz)
		{
			return a.x < b.x;
		}
		else if(bby < bbz)
		{
			return a.y < b.y;
		}
		else
		{
			return a.z < b.z;
		}
	},
	reset : function()
	{
		// Note that modules are not reset as they are loaded during page load
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
		World._tree = new jsBIH(3);
		World._renderProxy = [];
		World._classes = {};
		World._level = '';
		$('#cache').empty();
	},
	setCameraFocus : function(obj)
	{
		World._cameraFocus = obj;
	},
	addTileset : function(filename)
	{
		// Important: The image must have been previously listed in the current module's preload section

		if(!(filename in World.preload))
			throw 'Image not preloaded!';

		var img = World.preload[filename];
		return {
			image : img,
			src: filename
		};
	},
	addTilesetCanvas : function(width, height)
	{
		var canvas = document.createElement('canvas');
		canvas.setAttribute("width", width);
		canvas.setAttribute("height", height);
		$('#cache').append(canvas);
		return {
			image : canvas,
			ctx : canvas.getContext('2d')
		};
	},
	addModule : function(modid, object)
	{
		World._modules[modid] = object;
	},
	addClass : function(id, params)
	{
		// Physics shape defaults to box
		if(!('shape' in params))params.shape = World.BOX;
		if(!('flags' in params))params.flags = 0;
		if(!('size' in params))params.size = [1,1,1];
		if(!('internal' in params))params.internal = false;
		
		if(!('tiles' in params) && !params.internal)throw 'Class definition '+id+' missing tiles attribute';
		
		params.id = id;
		World._classes[id] = params;
	},
	removeClass: function(id)
	{
		// Called manually or when the refcount of a class reaches 0...
		if(!(id in World._classes))return;
		var c = World._classes[id];
		c.refcount = 0;
		if(typeof(c.tileset.ctx) != 'undefined')
		{
			$(c.tileset.image).remove();
		}
		delete World._classes[id];
	},
	createObject : function(classid, pos, options)
	{
		if(typeof(options) == 'undefined')
			options = {};

		// Complex object initialization
		var obj = new World.Entity(classid);
		obj.x = pos[0];
		obj.y = pos[1];
		obj.z = pos[2];
		
		if('init' in obj.shape)
			obj.shape.init.call(obj, options);
			
		// verify params
		if(!('fixed' in options))
		{
			if(!('mass' in options))
			{
				options.mass = 0;
			}
			options.fixed = options.mass<=0;
		}
		if(!('mass' in options))
		{
			options.mass = options.fixed?0:1;
		}
		
		// apply params
		if('phantom' in options)
			obj.phantom = options.phantom;
		if('significant' in options)
			obj.significant = options.significant;
		obj.mass = options.mass;
		obj.fixed = options.fixed;			
		World._objects.push(obj);

		// Objects have to be added to the renderProxy as well
		World._renderProxy.push({
			begin: true,
			d: 0,
			obj: obj
		});
		World._renderProxy.push({
			begin: false,
			d: 0,
			obj: obj
		});
		
		// If in editor mode, all objects appear movable
		if(options.fixed==false || World._editor.online == true) 
		{
			if(!options.phantom)
			{
				// Moving objects use sweep&prune for collision checking
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
			// And can be accessed quickly thru a separate array as well
			World._mobile.push(obj); 
		}
		else {
			// Whereas fixed objects go to a large tree for fast broadphase collision testing
			if(!('phantom' in options) || options.phantom == false)
			{
				World._tree.insert({
					intervals: [
						{a: pos[0]-obj.bx/2, b: obj.bx},
						{a: pos[1]-obj.by/2, b: obj.by},
						{a: pos[2]-obj.bz/2, b: obj.bz},
					],
					object: obj
				});
			}
			// ... And to their own quick-access array
			World._fixed.push(obj);
		}
		return obj;
	},
	removeObject : function(obj)
	{
		var idx = World._objects.indexOf(obj);
		if(idx != -1)
			World._objects.remove(idx);	
			
		if(typeof(obj.shape.refcount) != 'undefined')
		{
			obj.shape.refcount--;
			if(obj.shape.refcount <= 0)
			{
				World.removeClass(obj.shape.id);
			}
		}

		// renderproxy
		for(var i = 0; i < World._renderProxy.length; i++)
		{	
			var p = World._renderProxy[i];
			if(p.obj == obj)
			{
				World._renderProxy.remove(i);
				i--;
				continue;
			}
		}
		// If in editor mode, all objects appear movable
		if(World._editor.online) 
		{
			for(var i = 0; i < World._proxy.length; i++)
			{	
				var p = World._proxy[i];
				if(p.obj == obj)
				{
					World._proxy.remove(i);
					i--;
					continue;
				}
			}
			idx = World._mobile.indexOf(obj);
			if(idx != -1)
				World._mobile.remove(idx);	
		}
		else {
			World._tree.remove({
				object: obj
			});
			idx = World._fixed.indexOf(obj);
			if(idx != -1)
				World._fixed.remove(idx);	
		}
		
		// We also need to remove any references in the render graph
		if(typeof(obj.internal.after) != 'undefined')				
		{
			$.each(obj.internal.after, function(idx, other){
				var idx = other.internal.depends.indexOf(obj);
				if(idx!=-1)other.internal.depends.remove(idx);
			});
			$.each(obj.internal.depends, function(idx, other){
				var idx = other.internal.after.indexOf(obj);
				if(idx!=-1)other.internal.after.remove(idx);
			});
		}
	},
	createCompoundClass : function(classid, size)
	{
		// Used to create big classes that consist of many small tiles drawn together
		// Comes with an off-screen canvas 
		
		if(!(classid in World._classes))
			throw 'Invalid class!';
			
		var c = World._classes[classid];
		
		// construct class name...		
		var newclass = 'compound('+classid + ',' + size[0] + ',' + size[1] + ',' + size[2] + ')';
		if(!(newclass in World._classes))
		{
			console.log('creating compound class ' + newclass);
			var rect = Cuboid2Screen(0,0,0,size[0],size[1],size[2]);
		
			var tileset = World.addTilesetCanvas(rect.w, rect.h);
	
			var modx = Math.ceil(c.size[0]) - c.size[0];	
			var mody = Math.ceil(c.size[1]) - c.size[1];	
			var modz = Math.ceil(c.size[2]) - c.size[2];	
			World.addClass(newclass, {
				tileset: tileset,
				category: 'dynamic',
				tiles: [0, 0],
				size: [size[0],size[1],size[2]],
				refcount: 0
			});
			
			var ctx = tileset.ctx;
			
			// Find origin..
			var zero = {
				x: (size[1]-1)*16,
				y: (size[2]-1)*16
			};

			// Next we draw the cube filled with tiny objects..
			for(var zz = 0; zz < size[2]; zz+=Math.ceil(c.size[2]))
			for(var yy = 0; yy < size[1]; yy+=Math.ceil(c.size[1]))
			for(var xx = 0; xx < size[0]; xx+=Math.ceil(c.size[0]))
			{
				var coords = Cuboid2Screen(
					xx+Math.ceil(c.size[0])/2, 
					yy+Math.ceil(c.size[1])/2,
					zz+Math.ceil(c.size[2])/2,
					(c.size[0]), 
					(c.size[1]),
					(c.size[2]));
			
				coords.x += zero.x;
				coords.y += zero.y;	
						
				var t = c.tiles;
				if(c.flags & World.DIRECTED)t = t[0];
				if(c.flags & World.ANIMATED)
					t = t[0];
				else if(c.flags & World.ANIMATED_RANDOM)
					t = t[Math.floor(t.length*Math.random())];
				
				draw({
					x: coords.x, 
					y: coords.y, 
					tilex: t[0], 
					tiley: t[1], 
					src: c.tileset.image,
					dest: ctx,
					tilew: coords.w,
					tileh: coords.h
				});
			}
		}
	},
	linkObjects: function(o1, o2, maxforce)
	{
		// Negative maxforce = unbreakable link
		if(maxforce == undefined)maxforce = -1;

		// null may be passed to o2 to link o1 to the world instead
		var dx = o1.x;
		var dy = o1.y;
		var dz = o1.z;
		
		if(o2 != null)
		{
			dx = o2.x-o1.x;
			dy = o2.y-o1.y;
			dz = o2.z-o1.z;
		}
		var lnk = {
			o1 : o1,
			o2 : o2,
			maxforce : maxforce,
			dx : dx, 
			dy : dy,
			dz : dz
		};
		World._links.push(lnk);
		return lnk;
	},
	removeLink: function(o1, o2)
	{
		for(var i = 0; i < World._links.length; i++)
		{
			var l = World._links[i];
			if(l.o1 == o1 && l.o2 == o2)
			{
				World._links.splice(i,1);
				i--;
			}
		}
	},
	render : function()
	{
		var ctx = Graphics.ctx;
//		console.time('render');

		// Update camera position
		if(World._cameraFocus != null)
		{
			World._cameraPosX = World._cameraFocus.x;
			World._cameraPosY = World._cameraFocus.y;
			World._cameraPosZ = World._cameraFocus.z;
		}

		World.drawBackground();

		var wo = World._objects;
		
		// Find dirty objects...
		var dirty = [];
		for(var i = 0;i < wo.length; i++)
		{
			if(wo[i].dirty)
				dirty.push(wo[i]);
		}
		var comparisons  = 0;
			
		// we must make changes to the render graph...
		if(dirty.length > 0)
		{
			// first, remove all dirty objects from it..
			for(var i = 0; i < dirty.length; i++)
			{
				var o = dirty[i];
				
				if(typeof(o.internal) == 'undefined')
					o.internal = {};
				
				if(typeof(o.internal.after) != 'undefined')				
				{
					$.each(o.internal.after, function(idx, other){
						var idx = other.internal.depends.indexOf(o);
						if(idx!=-1)other.internal.depends.remove(idx);
					});
					$.each(o.internal.depends, function(idx, other){
						var idx = other.internal.after.indexOf(o);
						if(idx!=-1)other.internal.after.remove(idx);
					});
				}
				o.internal.depends = [];
				o.internal.after = [];
			}
			
			// next we prepare the proxy array
			for(var i = 0 ; i < World._renderProxy.length; i++)
			{
				var p = World._renderProxy[i];
				var o = p.obj;
				p.d = (o.x - o.y+1)*16 + ((p.begin==true)?-1:1) * 16*(o.bx+o.by)/2;
			}

			// Sort it
			insertionSort(World._renderProxy, function(a,b){
				return a.d < b.d;
			});
		
			// Thanks to sweep n prune, we dont have to check each object pair
			var objectbuffer = {};
			for(var i = 0; i < World._renderProxy.length; i++)
			{
				var p = World._renderProxy[i];
				if(p.begin == false)
				{			
					// Remove object from buffer
					delete objectbuffer[p.obj.id];
				}
				else
				{
					$.each(objectbuffer, function(key, val){
						var o1 = p.obj;
						var o2 = val.obj;
						if(!o1.dirty && !o2.dirty)return;
						var res = World._depth_func(o1, o2);
						comparisons++;
						if(res === false)
						{
							o2.internal.after.push(o1);
							o1.internal.depends.push(o2);
						}
						else if(res === true)
						{
							o1.internal.after.push(o2);
							o2.internal.depends.push(o1);
						}
					});

					// Add object to buffer 
					objectbuffer[p.obj.id] = p;
				}
			}
			for(var i = 0; i < dirty.length; i++)
			{
				dirty[i].dirty = false;
			}
		}
		// Graph is ok. now flatten it and render
		var result = [];

		for(var i = 0; i < World._objects.length; i++)
		{
			var o = World._objects[i];
			o.alpha = 1.0;
			o.internal.visited = false;
		};
		
		function visit(node){
			if(!node.internal.visited)
			{
				node.internal.visited = true;
				for(var i = 0; i < node.internal.after.length; i++)
					visit(node.internal.after[i]);
				result.push(node);
			}
			if(node.significant)
			{
				for(var i = 0; i < node.internal.after.length; i++)
					node.internal.after[i].alpha = 0.25;
			}
		}
		
		for(var i = 0;i < wo.length; i++)
			if(wo[i].internal.depends.length == 0)
				visit(wo[i]);
		
		// if result.length != wo.length, the graph contained cycles
		// our only option now is to brutally force all objects to the result set
		if(wo.length != result.length)
		{
			for(var i = 0;i < wo.length; i++)
				visit(wo[i]);
		}
		
		for(var i = result.length-1;i >= 0; i--)
			World.drawObject(result[i]);
			
		var ctx = Graphics.ctx;
		// draw render graph...
		/*ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'red';

		var focus = World2Screen(World._cameraPosX, World._cameraPosY, World._cameraPosZ);
		var c1,c2;	
		
		for(var i = 0; i < wo.length; i++)
		{
			var o = wo[i];
			c1 = Cuboid2Screen(o.x, o.y, o.z, o.bx, o.by, o.bz);
			c1.x += 320-focus.x;
			c1.y += 240-focus.y;

			c1.x += c1.w/2;
			c1.y += c1.h/2;
			
			for(var a = 0; a < o.internal.after.length; a++)
			{
				var v = o.internal.after[a];
			
				ctx.moveTo(c1.x, c1.y);
				c2 = Cuboid2Screen(v.x, v.y, v.z, v.bx, v.by, v.bz);
				c2.x += 320-focus.x;
				c2.y += 240-focus.y;
				
				c2.x += c2.w/2;
				c2.y += c2.h/2;
				
				c2.x = c1.x+(c2.x-c1.x)*0.9;
				c2.y = c1.y+(c2.y-c1.y)*0.9;
				
				ctx.lineTo(c2.x, c2.y);
				ctx.arc(c2.x, c2.y, 3, 0, 2*Math.PI, true);
			}
			if(o.internal.depends.length == 0)
			{
				ctx.moveTo(c1.x, c1.y);
				ctx.arc(c1.x, c1.y, 5, 0, 2*Math.PI, true);
			}
		}
		ctx.closePath();
		ctx.stroke();
		
		*/
			 
		/*
		ctx.strokeStyle = 'blue';
		ctx.beginPath();
		for(var i = 0; i < result.length; i++)
		{
			var o = result[i];
			c1 = Cuboid2Screen(o.x, o.y, o.z, o.bx, o.by, o.bz);
			c1.x += 320-focus.x;
			c1.y += 240-focus.y;

			c1.x += c1.w/2;
			c1.y += c1.h/2;
			if(i==0)
				ctx.moveTo(c1.x, c1.y);
			else
				ctx.lineTo(c1.x, c1.y);
		}
		ctx.closePath();
		ctx.stroke();*/
		
		if(World._editor.online)
		{
			ctx.save();
			World.editorStep();
			ctx.restore();
		}
		/*
		ctx.fillStyle    = '#000';
		ctx.font         = '16px sans-serif';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		ctx.fillText  ('Objects: '+World._objects.length + ' depth comparisons: ' + comparisons, 30, 30);*/

//		console.timeEnd('render');
	},
	physicsStep : function()
	{
//		console.time('physics');
		
		if(World._editor.online)
			return;

		for(var iter = 0; iter < World._physicsIterations; iter++)
		{
			// Sweep-line the objects
			//
			
			// Initialize proxy array
			for(var i = 0 ; i < World._proxy.length; i++)
			{
				var p = World._proxy[i];
				var o = p.obj;
				p.d = (o.x + o.y + o.z) + ((p.begin==true)?-1:1) * (o.bx+o.by+o.bz)/2;
			}

			// Sort it
			insertionSort(World._proxy, function(a,b){
				return a.d < b.d;
			});
			
			/* 
				This is the main body of the sweep & prune algorithm
				We also collide mobile objects to fixed objects inside this loop
			*/

			var objectbuffer = {};
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
					
					// Should this object collide with fixed objects?
					if(o1.collideFixed)
					{
						// Look for nearby fixed objects, collide
						var result = World._tree.search({
							intervals:
							[
								{a: o1.x-o1.bx/2, b: o1.bx},
								{a: o1.y-o1.by/2, b: o1.by},
								{a: o1.z-o1.bz/2, b: o1.bz}
							]
						}); 
						for(var a = 0; a < result.length; a++)
						{
							World._tryCollideAndResponse(o1, result[a]);
						}
					}
				}
			}
			// process links
			for(var i = 0; i < World._links.length; i++)
			{
				var l = World._links[i];
				var o1 = l.o1;
				var o2 = l.o2;

				var errorx, errory, errorz;

				if(o2 != null)
				{
					errorx = l.dx-(o2.x-o1.x);
					errory = l.dy-(o2.y-o1.y);
					errorz = l.dz-(o2.z-o1.z);
				}
				else
				{
					errorx = -l.dx+o1.x;
					errory = -l.dy+o1.y;
					errorz = -l.dz+o1.z;
				}
				var d = 1.1; // tweakable multiplier

				if(l.maxforce >= 0)
				{
					var totalforce = errorx*errorx+errory*errory+errorz*errorz;
					if(totalforce*d*2 > l.maxforce)
					{
						// link force has exceeded maxforce. Drop it
						World._links.splice(i,1);
						i--;
						continue;
					}
				}

				if(o2 == null)d*=2;

				o1.fx -= errorx*d;
				o1.fy -= errory*d;
				o1.fz -= errorz*d;
				if(o2 != null)
				{
					o2.fx += errorx*d;
					o2.fy += errory*d;
					o2.fz += errorz*d;
				}
			}
			// Euler integrate (my friends hate me for this)
			for(var i = 0; i < World._mobile.length; i++)
			{
				var obj = World._mobile[i];
				obj.vx += obj.fx/obj.mass;
				obj.vy += obj.fy/obj.mass;
				obj.vz += obj.fz/obj.mass;
				obj.x += obj.vx/World._physicsIterations;
				obj.y += obj.vy/World._physicsIterations;
				obj.z += obj.vz/World._physicsIterations;
				
				// Mark moving objects dirty so that the render graph gets rebuilt for them
				if(	Math.abs(obj.vx)>0.001||
					Math.abs(obj.vy)>0.001||
					Math.abs(obj.vz)>0.001)
					obj.dirty = true;
				
				// Air friction..
				var af = 0.001;
				     if(obj.vx > af) obj.vx -= af;
				else if(obj.vx < -af)obj.vx += af;
				else obj.vx = 0;
				     if(obj.vy > af) obj.vy -= af;
				else if(obj.vy < -af)obj.vy += af;
				else obj.vy = 0;
				     if(obj.vz > af) obj.vz -= af;
				else if(obj.vz < -af)obj.vz += af;
				else obj.vz = 0;
			
				// reset forces & set gravity ready for next round

				obj.fx = 0;
				obj.fy = 0;
				obj.fz = (obj.hasGravity)?(-0.04*obj.mass/World._physicsIterations) : 0;
			}
		}
//		console.timeEnd('physics');
	},
	_tryCollideAndResponse : function(o1, o2)
	{
		var colldata = World._collide(o1, o2);
		if(colldata != false)
		{
			// It's a HIT! What to do now?
			var nx = colldata.nx;
			var ny = colldata.ny;
			var nz = colldata.nz;
			var displacement = colldata.displacement;
			
			// fx = final force to apply.
			var fx = 0;
			var fy = 0;
			var fz = 0;
			
			// Here's what we do:
			// 1. Call possible collision listeners and come to an agreement about the surface velocity, friction and restitution
			// 2. Project surface velocity vector [vx,vy,vz] to plane defined by surface normal [nx,ny,nz] and call it SV (surface velocity)
			// 3. Calculate current delta velocity between objects, project it to the same plane and subtract it from SV. Store in SV.
			// 4. Friction force = -SV/|SV|*friction multiplier. Add to [fx,fy,fz]
			// 5. Elastic/Inelastic collision based on restitution
			// 6. Apply fx to both bodies
			// 7. Rejoice
			
			// 1:
			// Alert possible collision listeners, that can either:
			// - cancel the collision
			// - set  surface velocity (conveyor belt, character movement)
			// - and/or set extra force for collision (character jumping)
			// - do nothing

			// vx,vy,vz = Target surface velocity
			// friction = How willingly we follow the target speed
			var vx = 0;
			var vy = 0;
			var vz = 0;
			var friction = 0.1; // max friction force
			var restitution = 1; // coefficient of restitution. unused for now..
			for(var i = 0; i < 2; i++)
			{
				var cur   = i==0?o1:o2;
				var other = i==0?o2:o1;
				if('collision_listener' in cur)
				{
					var mul = i==0?1:-1;
					var ret = cur.collision_listener(cur, other, nx*mul, ny*mul, nz*mul, displacement);
					if(ret === false)
					{
						// collision_listener wants to let the object pass thru
						return;
					}
					else if(typeof(ret) == 'object')
					{
						if('vx' in ret && 'vy' in ret && 'vz' in ret)
						{
							// Surface velocity was given
							vx += ret.vx * mul;
							vy += ret.vy * mul;
							vz += ret.vz * mul;
						}
						if('fx' in ret && 'fy' in ret && 'fz' in ret)
						{
							// Extra force was given
							fx += ret.fx * mul;
							fy += ret.fy * mul;
							fz += ret.fz * mul;
						}
						if('friction' in ret)
							friction += ret.friction;
						if('restitution' in ret)
							restitution *= ret.restitution;
					}
				}
			}

			// 2: project [vx,vy,vz] to plane defined by normal vector [nx,ny,nz]

			// Point on plane = point-normal*((point)dot(normal))/(|normal|^2)
			//
			var svx,svy,svz;
			var d = (vx*nx+vy*ny+vz*nz)/(nx*nx+ny*ny+nz*nz);

			svx = vx-nx*d;
			svy = vy-ny*d;
			svz = vz-nz*d;
			
			// 3. Calculate current delta velocity between objects, project it to the same plane and subtract it from SV. Store in SV.
			var dvx = o2.vx-o1.vx;
			var dvy = o2.vy-o1.vy;
			var dvz = o2.vz-o1.vz;

			d = (dvx*nx+dvy*ny+dvz*nz)/(nx*nx+ny*ny+nz*nz);

			dvx = dvx-nx*d;
			dvy = dvy-ny*d;
			dvz = dvz-nz*d;
		
			svx = -svx-dvx;
			svy = -svy-dvy;
			svz = -svz-dvz;
			
			// 4. Friction force = -SV/|SV|*friction multiplier*displacement. Add to [fx,fy,fz]

			// We will also project both objects' velocities to the collision axis and calculate friction based on that...
			var o1v = (o1.vx*nx+o1.vy*ny+o1.vz*nz);// /(nx*nx+ny*ny+nz*nz); normal vector is normal
			var o2v = (o2.vx*nx+o2.vy*ny+o2.vz*nz);// /(nx*nx+ny*ny+nz*nz);
			
			var vcontact = displacement;
			
			fx += nx*vcontact/2;
			fy += ny*vcontact/2;
			fz += nz*vcontact/2;
				
			d = (svx*svx+svy*svy+svz*svz);
			if(d > 0)
			{
				d = Math.sqrt(d);
				svx /= d;
				svy /= d;
				svz /= d;
				// at this point svx,svy,svz defines the direction of the friction force

				vcontact = -o1v-o2v+displacement;
				
				friction *= vcontact * 10;
						
				if(friction > d)friction = d;		
				if(friction < 0)friction = 0;
				
				svx*=friction;
				svy*=friction;
				svz*=friction;

				fx -= svx/2;
				fy -= svy/2;
				fz -= svz/2;
			}

			o1.fx += fx;
			o1.fy += fy;
			o1.fz += fz;
			o2.fx -= fx;
			o2.fy -= fy;
			o2.fz -= fz;
		
			if(!o1.fixed && !o2.fixed)
			{
				restitution = 0;

				var msum = o1.mass + o2.mass;

				// o1v, o2v are velocities projected to normal axis
				// momentum is preserved, for the time being restitution is always 0 until someone rewrites this collision response function.
				// = i cant get it to work right.
				var momentum = o1.mass*o1v + o2.mass*o2v;
				
				var o1nv = (momentum + o2.mass*restitution*(o2v-o1v))/msum;
				var o2nv = (momentum + o1.mass*restitution*(o1v-o2v))/msum;

				// velocities have been determined on the normal axis, all we need to do now is
				// shift the velocities in 3d space by the numbah.
				
				o1v -= o1nv;
				o2v -= o2nv;

				o1.vx -= o1v*nx;
				o1.vy -= o1v*ny;
				o1.vz -= o1v*nz;
				o2.vx -= o2v*nx;
				o2.vy -= o2v*ny;
				o2.vz -= o2v*nz;
			}
			else {
				// one of the objects is fixed, other not (collision between two fixed objects is not possible)
				var fixed  = o1.fixed?o1:o2;
				var mobile = o1.fixed?o2:o1;
				var mult = o1.fixed?-1:1;

				// what we do here is prevent the mobile object from entering the fixed one
				var dotp = (mobile.vx*nx+mobile.vy*ny+mobile.vz*nz);
				dotp *= mult;
				if(dotp < 0)
				{
					// project mobile's velocity to the surface normal, this way we eliminate the normal component.
					d = (dotp)/(nx*nx+ny*ny+nz*nz);
					mobile.vx = mobile.vx-nx*d;
					mobile.vy = mobile.vy-ny*d;
					mobile.vz = mobile.vz-nz*d;
				}
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
		var dx = o2.x-o1.x;
		var dy = o2.y-o1.y;
		var dz = o2.z-o1.z;
	
		var tx = (o1.bx+o2.bx)/2;
		var ty = (o1.by+o2.by)/2;
		var tz = (o1.bz+o2.bz)/2;

		if(Math.abs(dx)>tx||Math.abs(dy)>ty||Math.abs(dz)>tz)
			return false;
		
		// Dispatch to dedicated worker functions
		var collisions = World._colliders[o1.shape.shape][o2.shape.shape](o1,o2);
		if(collisions.length == 0)
			return false;
		
		// We now have a list of points of collision. We select the one with 
		// smallest displacement
		var smallest = -1;
		var smallestval = 10;
		for(var i = 0; i < collisions.length; i++)
		{
			if(collisions[i].displacement < smallestval || smallest==-1)
			{
				smallestval = collisions[i].displacement;
				smallest = i;
			}
		}
		return collisions[smallest];
	},
	_registerCollider : function(type1, type2, fn)
	{
		if(World._colliders[type1] == undefined)
			World._colliders[type1] = {};
		if(World._colliders[type2] == undefined)
			World._colliders[type2] = {};
			
		World._colliders[type1][type2] = fn;
		World._colliders[type2][type1] = function(a,b){
			// We need to invert each axis here since we flip the order of the parameters..
			var ret = fn(b,a);
			var r;
			for(var i = 0; i < ret.length; i++)
			{
				r = ret[i];
				r.nx = -r.nx;
				r.ny = -r.ny;
				r.nz = -r.nz;
			}
			return ret;
		};
	},
	loadLevel : function(levelname, json, use_editor, onload_callback)
	{
		var module = World._modules[json.module];
		if(!module)
		{
			showErrorToast('Module was not found');
			return;
		}
		World.reset();
		
		World._level = levelname;
		World._editor.online = use_editor;
		
		function finish_preloading() {
			// Now that preloads are done, let's call the module's setup func that creates classes, etc
			
			module.load();
			var objects = json.objects;
			for(var i = 0; i < objects.length; i++)
			{
				var obj = objects[i];
				var classid = obj[0];
				var pos = obj[1];
				var mass = obj[2];
				var direction = obj[3];
				var instance = World.createObject(classid, pos, {mass: mass});
				instance.direction = direction;
			}
	
			if(World._editor.online)
			{
				// In editor mode we'll need a couple of custom classes and instances
				World.initEditor();
			}
			onload_callback(); // pass control back to main.js or whoever called loadLevel
		}
	
		World.preload_counter = module.preload.length;

		// Add image objects to World.preload and setup onload handlers
		// Last callback that gets called calls finish_preloading()
		for(var i = 0; i < module.preload.length; i++)
		{
			var src = module.preload[i];
			var img = new Image();
			img.onload = function(){
				if(--World.preload_counter == 0)
					finish_preloading();
			}
			img.src = src; // launches loading
			World.preload[src] = img;
		}

		// TODO: If we were to show a progress indicator or anything we would set it here and clear it in finish_preloading
	},
	saveLevel: function()
	{
		// Dump all objects and settings to a single json
		var obj = [];
		var json = {
			module: 'PlethoraOriginal', // Hardcoded for now
			objects: obj	
		};
		
		for(var i = 0 ; i < World._objects.length; i++)
		{
			var o = World._objects[i];
			if(!o.shape.internal)
			{
				obj.push([
					o.shape.id, [o.x,o.y,o.z], o.mass, o.direction
				]);
			}
		}
		return json;
	},
	getLevelName: function(){
		return World._level;
	}
};


World.Entity = function(classid)
{
	this.id = World._objectCounter++; // Unique id is assigned to each object
	
	// find out if classid is a compound classid..
	var m = classid.match(/compound\(([a-zA-Z]+),([0-9.]+),([0-9.]+),([0-9.]+)\)/);
	if(m != null)
	{
		World.createCompoundClass(m[1], [
			parseInt(m[2]),
			parseInt(m[3]),
			parseInt(m[4])
			]
		);
	}
	if(classid in World._classes)
	{
		this.shape = World._classes[classid];	
		this.bx = this.shape.size[0];
		this.by = this.shape.size[1];
		this.bz = this.shape.size[2];
		
		if(typeof(this.shape.refcount) != 'undefined')
			this.shape.refcount++;
	}
	else
	{
		console.log('Warning: Unknown class referenced: \''+classid+'\'');
		throw 'Unknown class!';
	}
}

World.Entity.prototype.shape = null;
World.Entity.prototype.id = 0;
World.Entity.prototype.x = 0; // pos
World.Entity.prototype.y = 0;
World.Entity.prototype.z = 0;
World.Entity.prototype.bx = 1; // bbox
World.Entity.prototype.by = 1;
World.Entity.prototype.bz = 1;
World.Entity.prototype.vx = 0; // velocity
World.Entity.prototype.vy = 0;
World.Entity.prototype.vz = 0;
World.Entity.prototype.fx = 0; // force
World.Entity.prototype.fy = 0;
World.Entity.prototype.fz = 0;
World.Entity.prototype.dirty = true; // Whether the render graph should be rebuilt
World.Entity.prototype.alpha = 1; // alpha used in drawing. 0 = completely transparent, 1 = zero transparency
World.Entity.prototype.hasGravity = true; // whether this object is affected by gravity 
World.Entity.prototype.collideFixed = true; // should this object collide with fixed objects
World.Entity.prototype.phantom = false; // Phantom objects cannot be collided to
World.Entity.prototype.visible = true; // invisible objects are cheap to draw :)
World.Entity.prototype.significant = false; // Used to make covering objects transparent
World.Entity.prototype.mass = 0;
World.Entity.prototype.direction = 0;
World.Entity.prototype.frame = 0; // current frame
World.Entity.prototype.frameTick = 0; // current tick
World.Entity.prototype.frameMaxTicks = 1; // ticks to reach until we switch to next frame (0 to disable animation)
World.Entity.prototype.setPos = function(x,y,z)
{
	if(typeof(x)!='number')
	{
		z = x[2];
		y = x[1];
		x = x[0];
	}
	if(this.x != x || this.y != y || this.z != x)
		this.dirty = true;
	this.x = x;
	this.y = y;
	this.z = z;
}
World.Entity.prototype.setSize = function(bx,by,bz)
{
	if(typeof(bx)!='number')
	{
		bz = bx[2];
		by = bx[1];
		bx = bx[0];
	}
	if(this.bx != bx || this.by != by || this.bz != bx)
		this.dirty = true;
	this.bx = bx;
	this.by = by;
	this.bz = bz;
}
World.Collision = function(nx,ny,nz, displacement)
{
	this.nx = nx;
	this.ny = ny;
	this.nz = nz;
	this.displacement = displacement;
};


