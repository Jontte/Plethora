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
			var focus = World2Screen(World._cameraPosX, World._cameraPosY, World._cameraPosZ);
			if(!wec.open)
			{
				// Keyboard movement
				if(Key.changed(KEY_PAGEUP) && Key.get(KEY_PAGEUP))
				{
					this.z++;
					this.dirty = true;
					World._cameraPosZ++;
				}
				if(Key.changed(KEY_PAGEDOWN) && Key.get(KEY_PAGEDOWN))
				{
					this.z--;
					this.dirty = true;
					World._cameraPosZ--;
				}				
				// mouse movement
				focus = World2Screen(World._cameraPosX, World._cameraPosY, World._cameraPosZ);
				var pos = Screen2WorldXY(World.mouseX+focus.x-320, World.mouseY+focus.y-240, this.z-0.5);
				
				var prev = [this.x, this.y];
				this.x = pos.x;
				this.y = pos.y;
				if(this.x != prev[0] || this.y != prev[1])
					this.dirty = true;
			
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
				draw({
					x: coords.x, 
					y: coords.y, 
					tilex: c[0], 
					tiley: c[1], 
					src: World._editor.tileset.image
				});
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
			var we = World._editor;
			var wec = World._editor.classBrowser;
			var ctx = Graphics.ctx;
			var prevpos, prevsize;
			prevpos = [this.x, this.y, this.z];
			prevsize= [this.bx, this.by, this.bz];
			var c = wec.classes[wec.selectedCategory][wec.selectedClass[wec.selectedCategory]].c;
			
			Graphics.ctx.save();
			
			var focus = World2Screen(World._cameraPosX, World._cameraPosY, World._cameraPosZ);

			var xdir = 0;
			var ydir = 0;
			var zdir = 0;			
			if(we.drag.dragging == true)
			{
				// mouse movement
				this.bx = Math.abs(we.drag.x - we.layer.x)+1;
				this.by = Math.abs(we.drag.y - we.layer.y)+1;
				this.bz = Math.abs(we.drag.z - (we.layer.z + c.size[2]/2))+1;
				
				if(this.bx<c.size[0])this.bx=c.size[0];
				if(this.by<c.size[1])this.by=c.size[1];
				if(this.bz<c.size[2])this.bz=c.size[2];
				this.bx = Math.floor(this.bx/c.size[0])*c.size[0];
				this.by = Math.floor(this.by/c.size[1])*c.size[1];
				this.bz = Math.floor(this.bz/c.size[2])*c.size[2];

				xdir = sign(we.drag.x - we.layer.x);
				ydir = sign(we.drag.y - we.layer.y);
				zdir = sign(we.drag.z - we.layer.z - c.size[2]/2);
				
				this.x = we.drag.x - xdir * Math.max(0, this.bx/2-c.size[0]/2);
				this.y = we.drag.y - ydir * Math.max(0, this.by/2-c.size[1]/2);
				this.z = we.drag.z - zdir * Math.max(0, this.bz/2-c.size[2]/2);
			}
			else
			{
				this.bx = c.size[0];
				this.by = c.size[1];
				this.bz = c.size[2];
				this.x = we.layer.x;
				this.y = we.layer.y;
				this.z = we.layer.z+this.bz/2;			
			}
			
			// fill bx,by,bz cuboid with sprites..
			for(var zz = 0; zz < this.bz; zz+=c.size[2])
			for(var yy = 0; yy < this.by; yy+=c.size[1])
			for(var xx = 0; xx < this.bx; xx+=c.size[0])
			{
				var coords = Cuboid2Screen(
					this.x+xx-(this.bx/2-c.size[0]/2), 
					this.y+yy-(this.by/2-c.size[1]/2), 
					this.z+zz-(this.bz/2-c.size[2]/2), 
					c.size[0], c.size[1], c.size[2]);
				
				coords.x += 320-focus.x;
				coords.y += 240-focus.y;
			
				Graphics.ctx.globalAlpha = 0.5;
			
				
				if(Key.get(MOUSE_LEFT) && we.selectedObject != null)
				{
					draw({
						x: coords.x,
						y: coords.y,
						tilex: 3,
						tiley: 11,
						src: we.tileset.image
					});
				}
				else
				{
					var t = c.tiles;
					while(typeof(t[0]) != 'number')t = t[0];
					draw({
						x: coords.x, 
						y: coords.y, 
						tilex: t[0], 
						tiley: t[1], 
						src: c.tileset.image,
						tilew: coords.w,
						tileh: coords.h
					});
				}
			}
			
			ctx.fillStyle    = '#000';
			ctx.font         = '16px sans-serif';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';
			ctx.fillText  ('bx,by,bz: ('+this.bx+', '+this.by+', '+this.bz+') x,y,z: ('+this.x+', '+this.y+', '+this.z+')', 30, 80);

			ctx.fillText  ('mx,my: ('+focus.x+', '+focus.y+')', 30, 120);
			
			Graphics.ctx.restore();
			if(wec.online)
			{
				we.drag.dragging = false;
			}
			else
			{
				if(Key.get(MOUSE_LEFT) && Key.changed(MOUSE_LEFT))
				{
					World._editor.selectedObject = null;			
					we.drag.dragging = false;
					// look for object under cursor

					World.addScan({
						pos : [this.x, this.y, this.z],
						size: [this.bx, this.by, this.bz],
						c: c,
						callback: function(objects){
							
							for(var i = 0; i < objects.length ; i++)
							{
								var obj = objects[i];
								if(!obj.phantom)
								{
									World._editor.selectedObject = obj;
									World._editor.selectionOffsetX = obj.x - this.x;
									World._editor.selectionOffsetY = obj.y - this.y;
									World._editor.selectionOffsetZ = obj.z - this.z;
									return;
								}
							}				
							// No object was selected: start dragging here
							we.drag.x = we.layer.x;
							we.drag.y = we.layer.y;
							we.drag.z = we.layer.z+c.size[2]/2;
							we.drag.dragging = true;
						}
					});
				}
				else if(!Key.get(MOUSE_LEFT) && Key.changed(MOUSE_LEFT))
				{
					if(we.drag.dragging == true)
					{
						World.addScan({
							pos : [this.x, this.y, this.z],
							size: [this.bx, this.by, this.bz],
							c: c,
							callback: function(objects)
							{
								// If CTRL is held, kill all objects beneath cursor
								// Otherwise only create if theres room
								var create = true;
								if(Key.get(KEY_CTRL))
								{
									$.each(objects, function(idx, obj){
										if(!obj.phantom)
											World.removeObject(obj);
									});
								}
								else
								{
									for(var i = 0; i < objects.length; i++)
									{
										var o = objects[i];
										if(!o.phantom)
										{
											create = false;
											break;
										}
									}
								}
								if(create)
								{
									var newid = this.c.id;
									if(	this.size[0] != this.c.size[0] ||
										this.size[1] != this.c.size[1] ||
										this.size[2] != this.c.size[2] )
									{
										// a huge object compound..
										newid = 'compound('+newid+','+this.size[0]+','+this.size[1]+','+this.size[2]+')';
									}
									World.createObject(newid, this.pos, {fixed: true});
								}
							}
						});
					}
					we.drag.dragging = false;
				}
				else if(Key.get(MOUSE_RIGHT) && !we.drag.dragging)
				{
					we.selectedObject = null;
					World.addScan({
						pos : [this.x, this.y, this.z],
						size: [this.bx, this.by, this.bz],
						callback: function(objects){
							$.each(objects, function(idx, obj){
								if(!obj.phantom)
									World.removeObject(obj);
							});
						}
					});
				}
				
				
				
				if(Key.get(MOUSE_LEFT) && !Key.changed(KEY_LEFT) && we.selectedObject != null)
				{
					// While holding down, make selected object follow cursor
					we.selectedObject.setPos(
						this.x + we.selectionOffsetX,
						this.y + we.selectionOffsetY,
						this.z + we.selectionOffsetZ);
				}
				
				
				
			}
			if(this.x != prevpos[0] || this.y != prevpos[1] || this.z != prevpos[2] ||
			   this.bx != prevsize[0] || this.by != prevsize[1] || this.bz != prevsize[2])
				this.dirty = true;
		}
	});
	var layer = World.createObject('E_layer', [0,0,-0.5], {
		phantom: true
	});
	World.createObject('E_ghost', [0,0,0], {
		phantom: true
	});
	
	var we = World._editor;
	
	we.layer = layer;
	we.selectedClass = 0;
	
	we.drag = {
		x: 0,
		y: 0,
		z: 0,
		dragging : false
	};
	we.selectedObject = null;
	we.selectionOffsetX = 0;
	we.selectionOffsetY = 0;
	we.selectionOffsetZ = 0;
	
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
		if(!('internal' in c) || c.internal === false)
		{
			var wec = we.classBrowser;

			var cat = 'uncategorized';
			if('category' in c)
				cat = c.category;
			
			if(cat == 'dynamic')
				return;
			
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
	var we = World._editor;
	var ctx = Graphics.ctx;	
	
	/* draw selection overlay .. */
	
	if(we.selectedObject != null)
	{
		World.drawHighlight(we.selectedObject);
	}

	/*	
		In the next step we do a sweep&prune of all objects and execute any
		scans
	*/
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
		
		// Camera movement
		var step = 1;
		if(Key.get(KEY_LEFT))
		{
			World._cameraPosX -= step;
			World._cameraPosY += step;
		}
		if(Key.get(KEY_RIGHT))
		{
			World._cameraPosX += step;
			World._cameraPosY -= step;
		}
		if(Key.get(KEY_UP))
		{
			World._cameraPosX -= step;
			World._cameraPosY -= step;
		}
		if(Key.get(KEY_DOWN))
		{
			World._cameraPosX += step;
			World._cameraPosY += step;
		}
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
				
				ctx.fillRect(Math.floor(c.x), Math.floor(c.y), 32, 32);
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
					ctx.strokeRect(Math.floor(c.x), Math.floor(c.y), 32, 32);
				}
				var t = c.c.tiles;
				while(typeof(t[0]) != 'number')t = t[0];

				draw({
					x:c.x, 
					y:c.y, 
					tilex: t[0], 
					tiley: t[1], 
					src: c.c.tileset.image
				});
			}
		}
	}
}











