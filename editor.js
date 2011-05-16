/*
	Editor-related JS functionality
*/

World.addScan = function(opts){
	opts.x = opts.pos[0];
	opts.y = opts.pos[1];
	opts.z = opts.pos[2];
	opts.bx = opts.size[0];
	opts.by = opts.size[1];
	opts.bz = opts.size[2];
	opts.id = World._objectCounter++;
	// pos, size and callback ought to be defined in opts..
	World._editor.scans.push(opts);
}
World.initEditor = function()
{
	World._editor.scans = [];
	World._editor.tileset = World.addTileset('tileset.png');	
	
	/* This class is the grid that appears below the current editing height */
	/* It also controls the visibility of other objects */
	World.addClass('E_layer',
	{
		internal: true, // prevents visibility in class browser
		init: function()
		{
			this.bx = 15;
			this.by = 15;
			this.bz = 0;
		},
		step: function()
		{
			var wec = World._editor.classBrowser;
			if(!wec.open)
			{
				// Keyboard movement
				if(Key.changed(KEY_UP) && Key.get(KEY_UP))
				{
					this.z++;
					World._cameraPosZ++;
				}
				if(Key.changed(KEY_DOWN) && Key.get(KEY_DOWN))
				{
					this.z--;
					World._cameraPosZ--;
				}
			
				
				// mouse movement
				var pos = Screen2WorldXY(World.mouseX-320, World.mouseY-240, this.z-0.5);
				this.x = pos.x;
				this.y = pos.y;
			
				// This object will control the alpha of all other objects..
			
				for(var i = 0; i < World._objects.length; i++)
				{
					var o = World._objects[i];
					if(o.z-o.bz/2 > this.z)
						o.alpha = 0.2;
					else if(o.z+o.bz/2 <= this.z)
						o.alpha = 1.0;
					else
						o.alpha = 1.0;
				}
			}
			// fill screen with transparent tiling...
			
			Graphics.ctx.save();
			
			var focus = World2Screen(World._cameraPosX, World._cameraPosY, World._cameraPosZ);
			for(var x = 0; x < 15; x++)
			for(var y = 0; y < 15; y++)
			{
				var d = Math.sqrt(Math.pow(x-7,2)+Math.pow(y-7,2));
				var alpha = 1.0-d/8;
				if(alpha < 0)alpha = 0;
				Graphics.ctx.globalAlpha = alpha/2;
				var coords = World2Screen(this.x+x-7, this.y+y-7, this.z);

				coords.x += 320-focus.x;
				coords.y += 240-focus.y;
				
				var c = [1,11];
				if(x == 7 && y == 7)
					c = [2,11];
				draw(coords.x, coords.y, c[0], c[1], World._editor.tileset.image);
			}
			Graphics.ctx.restore();
		}
	});
	/* This class is a phantom that appears under mouse cursor*/
	World.addClass('E_ghost',
	{
		internal: true, // prevents visibility in class browser
		init: function()
		{
			this.bx = 1;
			this.by = 1;
			this.bz = 1;
		},
		step: function()
		{
			this.x = this.user.layer.x;
			this.y = this.user.layer.y;
			this.z = this.user.layer.z+this.bz/2;
			
			Graphics.ctx.save();
			
			var focus = World2Screen(World._cameraPosX, World._cameraPosY, World._cameraPosZ);
			var coords = World2Screen(this.x, this.y, this.z);
			coords.x += 320-focus.x;
			coords.y += 240-focus.y;
			
			Graphics.ctx.globalAlpha = 0.5;
			var wec = World._editor.classBrowser;
			var c = wec.classes[wec.selectedCategory][wec.selectedClass[wec.selectedCategory]].c;
			var t = c.tiles;
			while(typeof(t[0]) != 'number')t = t[0];
			draw(coords.x, coords.y, t[0], t[1], c.tileset.image);
			
			Graphics.ctx.restore();
			
			if(Key.get(MOUSE_LEFT) && !wec.online)
			{
				World.addScan({
					pos : [this.x, this.y, this.z],
					size: [this.bx, this.by, this.bz],
					classid: c.id,
					callback: function(objects){
						if(objects.length == 0)
						{
							World.createObject(this.classid, this.pos, this.size, {fixed: true});
						}
//						else alert('not added because ' + objects[0].shape.id + ' on the way');
					}
				});
			}
			else if(Key.get(MOUSE_RIGHT) && !wec.online)
			{
				World.addScan({
					pos : [this.x, this.y, this.z],
					size: [this.bx, this.by, this.bz],
					callback: function(objects){
						$.each(objects, function(idx, obj){
							World.removeObject(obj);
						});
					}
				});
			}
		}
	});
	var layer = World.createObject('E_layer', [0,0,-0.5], [1,1,1], {
		fixed: false,
		phantom: true
	});
	World.createObject('E_ghost', [0,0,0], [1,1,1], {
		fixed: false,
		phantom: true,
		user: {
			layer: layer
		}
	});
	
	var we = World._editor;
	
	we.layer = layer;
	we.selectedClass = 0;
	
	we.classBrowser = {
		classes: [], // by category
		categories: {},
		newCategoryIndex: 0,
		selectedCategory: 0,
		selectedClass: [],
		alpha: 0,
		open: false
	};
	$.each(World._classes, function(id, c){
		if(typeof(c.internal) === 'undefined')
		{
			var wec = we.classBrowser;

			var cat = 'uncategorized';
			if(typeof(c.category) != 'undefined')
				cat = c.category;
			
			if(typeof(wec.categories[cat]) == 'undefined')
			{
				wec.categories[cat] = wec.newCategoryIndex;
				wec.classes.push([]);
				wec.newCategoryIndex++;
			}
			cat = wec.categories[cat];
				
			wec.classes[cat].push({
				x: 0,
				y: 0,
				c: c
			});
		}
	});
	var wec = we.classBrowser;
	$.each(wec.classes, function(key, val){
		wec.selectedClass.push(0);
	});
}

World.editorStep = function()
{
	/*	
		In the next step we do a sweep&prune of all objects and execute any
		scans
	*/
	var we = World._editor;
	var ctx = Graphics.ctx;	
	
	if(we.scans.length > 0)
	{
		// Add decoys for each scan..
		$.each(we.scans, function(idx, o){
			World._proxy.push({
				begin: true,
				d: 0,
				obj: o,
				callback: true,
				result: []
			});
			World._proxy.push({
				begin: false,
				d: 0,
				obj: o,
				callback: true,
				result: []
			});
		});
		we.scans = [];
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
	
		/*  This is the main body of the sweep & prune algorithm */

		var objectbuffer = {};
		for(var i = 0; i < World._proxy.length; i++)
		{
			var p = World._proxy[i];
			if(p.begin == false)
			{
			
//				alert('end ' + p.obj.id + ' at ' + p.d);
				// Remove object from buffer
				delete objectbuffer[p.obj.id];
			}
			else
			{
//				alert('begin ' + p.obj.id + ' at ' + p.d);
				if(typeof(p.callback) != 'undefined')
				{
					$.each(objectbuffer, function(key, val){
						// verify val collides p...
						var a = p.obj;
						var b = val.obj;
						var mx = (a.bx+b.bx)/2;
						var my = (a.by+b.by)/2;
						var mz = (a.bz+b.bz)/2;
						if(	Math.abs(a.x-b.x) < mx && 
							Math.abs(a.y-b.y) < my && 
							Math.abs(a.z-b.z) < mz)
							p.result.push(b);
					});
				}
				$.each(objectbuffer, function(key, val){
					if(typeof(val.callback) != 'undefined')
					{
						// verify val collides p...
						var a = p.obj;
						var b = val.obj;
						var mx = (a.bx+b.bx)/2;
						var my = (a.by+b.by)/2;
						var mz = (a.bz+b.bz)/2;
						if(	Math.abs(a.x-b.x) < mx && 
							Math.abs(a.y-b.y) < my && 
							Math.abs(a.z-b.z) < mz)
							val.result.push(a);
						}
				});

				// Add object to buffer 
				objectbuffer[p.obj.id] = p;
			}
		}
		// Remove scans and execute callbacks...
		var temp = [];
		for(var i = 0; i < World._proxy.length; i++)
		{
			var p = World._proxy[i];
			if(p.callback)
			{
				if(p.begin == true)
				{
					temp.push(p);
				}
				World._proxy.remove(i);
				i--;
			}
		}
		$.each(temp, function(idx, val){
			val.obj.callback(val.result);
		});
		
	}
	// Draw class browser..
	var wec = we.classBrowser;
	if(Key.get(KEY_SPACE))
	{
		wec.open = true;
		if(wec.alpha < 1.0)
			wec.alpha = (wec.alpha+1.0)/2;
			
		if(Key.get(KEY_LEFT) && Key.changed(KEY_LEFT))
		{
			wec.selectedClass[wec.selectedCategory] = 
				wrap(wec.selectedClass[wec.selectedCategory] - 1,
				wec.classes[wec.selectedCategory].length);
		}
		if(Key.get(KEY_RIGHT) && Key.changed(KEY_RIGHT))
		{
			wec.selectedClass[wec.selectedCategory] = 
				wrap(wec.selectedClass[wec.selectedCategory] + 1,
				wec.classes[wec.selectedCategory].length);
		}
		if(Key.get(KEY_UP) && Key.changed(KEY_UP))
		{
			wec.selectedCategory = wrap(wec.selectedCategory-1,wec.classes.length);
		}
		if(Key.get(KEY_DOWN) && Key.changed(KEY_DOWN))
		{
			wec.selectedCategory = wrap(wec.selectedCategory+1,wec.classes.length);
		}
	}
	else
	{
		wec.open = false;
		if(wec.alpha > 0.0)
			wec.alpha /= 2;
	}
	if(wec.alpha>0.001)
	{
		ctx.globalAlpha = wec.alpha/2;
		ctx.fillStyle = 'black';
		ctx.fillRect(0,0,640,480);
		// Draw class selector..
		
		if(Key.changed(KEY_SPACE) && Key.get(KEY_SPACE))
		{
			// Move each icon to their starting position...
			$.each(wec.classes, function(catid, clist){
				$.each(clist, function(idx, c){
					c.x = Math.random()*640;
					c.y = Math.random()*480;
				});
			});
		}
		
		ctx.globalAlpha = wec.alpha;
		ctx.fillStyle = 'black';
		
		var cl = wec.classes[wec.selectedCategory][wec.selectedClass[wec.selectedCategory]];
		ctx.fillStyle    = '#000';
		ctx.font         = '16px sans-serif';
		ctx.textAlign = 'right';
		ctx.textBaseline = 'middle';
		ctx.fillText  ('Class: '+cl.c.id, 320-5, 240+16);
		ctx.fillText  ('Category: '+cl.c.category, 320-5, 240+32+16);
		
		// scrollselector sizes..
		for(var y = 0 ; y < wec.classes.length; y++)
		{
			for(var x = 0 ; x < wec.classes[y].length; x++)
			{
				var c = wec.classes[y][x];
				
				var tx = wrap(x-wec.selectedClass[y], wec.classes[y].length);
				var ty = wrap(y-wec.selectedCategory+Math.floor(wec.classes.length/2), wec.classes.length)-Math.round(wec.classes.length/2);
				
				tx = tx*32+320;
				ty = ty*32+240;
				
				var a = 0.50;
				c.x = (c.x*a+tx*(1.0-a));
				c.y = (c.y*a+ty*(1.0-a));
				if(Math.abs(c.x-tx)<1)c.x=tx;
				if(Math.abs(c.y-ty)<1)c.y=ty;
				
				ctx.fillRect(c.x, c.y, 32, 32);
				if(x==wec.selectedClass[y])
				{
				}
			}
		}
		for(var y = 0 ; y < wec.classes.length; y++)
		{
			for(var x = 0 ; x < wec.classes[y].length; x++)
			{
				var c = wec.classes[y][x];
				if(y == wec.selectedCategory && x == wec.selectedClass[y])
				{
					ctx.strokeStyle = 'red';
					ctx.lineWidth = 3;
					ctx.strokeRect(c.x, c.y, 32, 32);
				}
				var t = c.c.tiles;
				while(typeof(t[0]) != 'number')t = t[0];

				draw(c.x, c.y, t[0], t[1], c.c.tileset.image);
			}
		}
	}
}











