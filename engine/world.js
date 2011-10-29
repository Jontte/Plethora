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
		proxy: [], // Separate object collision proxy for all objects in editor mode
		unsaved_changes: false
	},
	_ctx: null, // Handle to the graphics context of the main canvas
	_cache: null, // Reference to a hidden div where canvases can be stored on the fly
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
	init : function(render_elem, cache_elem)
	{
		// Called before any other method.
		// Params: 
		// 1. canvas element where the whole shebang is drawn
		// 2. a hidden div where on-the-fly-created canvases can be stored

		World._ctx = render_elem.getContext('2d');
		World._cache = cache_elem;

        // Register key manager
        Key.register(render_elem);
				
		// Start capturing mouse position...
		$(render_elem).mousemove(function(e){
			var x = e.pageX - this.offsetLeft;
			var y = e.pageY - this.offsetTop;
			World.mouseX = x;
			World.mouseY = y;
		}); 
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
		World._editor.unsaved_changes = false;
		World._cache.innerHTML=''; // Clear the cache
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
		$(World._cache).append(canvas);
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
		if(!('defaults' in params))params.defaults = {};
		
		if(params.shape == World.SLOPE)
		{
			// If the shape is a World.SLOPE, add the default plane normal
			if(!('plane' in params))
				params.plane = [-1,0,1];
			// We also normalize the normal here..
			var p = params.plane;
			var len = p[0]*p[0]+p[1]*p[1]+p[2]*p[2];
			p[0]/=len;
			p[1]/=len;
			p[2]/=len;
		}
		
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
		obj.direction = options.direction||0;
		
		if('init' in obj.shape)
			obj.shape.init.call(obj, options);
		
		// Grab handle to class
		var c = obj.shape;
		
		// verify params
		if(!('mass' in options))
		{
			options.mass = (c.defaults.mass)||0;
		}
		
		// apply params
		if('phantom' in options)
			obj.phantom = options.phantom;
		if('significant' in options)
			obj.significant = options.significant;
		obj.mass = options.mass;
		obj.fixed = options.mass<=0;			
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
		if(obj.fixed==false || World._editor.online == true) 
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
		obj.zombie = true;
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
					Math.ceil(c.size[0]), 
					Math.ceil(c.size[1]),
					Math.ceil(c.size[2]));
			
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
		var ctx = World._ctx;
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
			
		var ctx = World._ctx;
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
	loadLevel : function(levelname, json, use_editor, onload_callback)
	{
		// Backward compability
		var module_list = json.modules?json.modules.slice():[json.module];
		for(var i = 0; i < module_list.length; i++)
		{
			var module = World._modules[module_list[i]];
			if(!module)
			{
				showErrorToast('Module '+module_list[i]+' was not found');
				// TODO: error callback or somethin ?
				return;
			}
			module_list[i] = module;
		}
		World.reset();
		
		World._level = levelname;
		World._editor.online = use_editor;
		
		
		function finish_preloading() {
			// Now that preloads are done, let's call each module's setup func that creates classes, etc
			// TODO: The modules may have dependencies to each other, gotta be careful when calling module.load() for each of them
			
			for(var i = 0; i < module_list.length; i++)
				module_list[i].load();
			
			// Check version:
			if(!('version' in json))
			{
				// Prehistoric level format that had very little customization...
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
			}
			else if(json.version == 1)
			{
				// Version 1
				var objects = json.objects;
				for(var i = 0; i < objects.length; i++)
				{
					var obj = objects[i];
					var classid = obj.c;
					var pos = obj.p;
					var features = obj.f;
					var instance = World.createObject(classid, pos, features);
				}
			}
	
			if(World._editor.online)
			{
				// In editor mode we'll need a couple of custom classes and instances
				World.initEditor();
			}
			onload_callback(); // pass control back to main.js or whoever called loadLevel
		}
	
		// Get rid of duplicates by storing images temporarily in an object by their src
		var sources = {
			'img/editor.png': 1 // Always load editor graphics
		};
		for(var i = 0; i < module_list.length; i++)
		{
			var m = module_list[i];
			for(var a = 0; a < m.preload.length; a++)
			{
				var p = m.preload[a];
				sources[p] = 1;
			}
		}
		// Count number of unique srcs..
		// Add image objects to World.preload and setup onload handlers
		// Last callback that gets called calls finish_preloading()
		World.preload_counter = 0;
		for(var i in sources)
		{
			// Can't combine these loops.. what if preload_counter reaches 0 while it is being run?
			if(!sources.hasOwnProperty(i))
				continue;
			World.preload_counter ++;
		}
		for(var i in sources)
		{
			if(!sources.hasOwnProperty(i))
				continue;
			
			var src = i;
			var img = new Image();
			img.onload = function(){
				if(--World.preload_counter == 0)
					finish_preloading();
			}
			img.src = src; // launch loading
			World.preload[src] = img;
		}
		
		// TODO: If we were to show a progress indicator or anything we would set it here and clear it in finish_preloading
	},
	saveLevel: function()
	{
		World._editor.unsaved_changes = false;
		// Dump all objects and settings to a single json
		var objects = [];
		var json = {
			modules: ['PlethoraOriginal','TubeWorks'], // Hardcoded for now
			version: '1', // we want to be able to load older level formats as well..
			objects: objects	
		};
		
		for(var i = 0 ; i < World._objects.length; i++)
		{
			var o = World._objects[i];
			var c = o.shape;
			if(!o.shape.internal)
			{
				var features = {};
				var cur = {};
				// Here we check a couple of basic parameters and see if they've been changed from their default values.. if so, include them
				if(o.mass != (c.defaults.mass||0))
					features.mass = o.mass;
				if((c.flags & World.DIRECTED) && o.direction != 0)
					features.direction = o.direction;
				
				var cur = {
					c: o.shape.id, 
					p: [o.x,o.y,o.z]
				};
				if(!$.isEmptyObject(features))
					cur.f = features;
				objects.push(cur);
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
World.Entity.prototype.zombie = false; // whether this object is still managed by World or not. When zombie=true, all handles should be dropped..
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


