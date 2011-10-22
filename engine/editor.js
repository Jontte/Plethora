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
	World._editor.tileset = World.addTileset('img/editor.png');	
	
	/* This class is the grid that appears below the current editing height */
	/* It also controls the visibility of other objects */
	World.addClass('E_layer',
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
			var wec = World._editor.classBrowser;
			var focus = World2Screen(World._cameraPosX, World._cameraPosY, World._cameraPosZ);
			if(!wec.open)
			{
				// Keyboard & Mouse wheel movement up/down
				if((Key.changed(KEY_PAGEUP) && Key.get(KEY_PAGEUP)) || Key.changed(MOUSE_WHEEL_UP))
				{
					this.z++;
					this.dirty = true;
					World._cameraPosZ++;
				}
				if((Key.changed(KEY_PAGEDOWN) && Key.get(KEY_PAGEDOWN)) || Key.changed(MOUSE_WHEEL_DOWN))
				{
					this.z--;
					this.dirty = true;
					World._cameraPosZ--;
				}				
				// mouse movement horizontally
				focus = World2Screen(World._cameraPosX, World._cameraPosY, World._cameraPosZ);
				var pos = Screen2WorldXY(World.mouseX+focus.x-320, World.mouseY+focus.y-240, this.z-0.5);
				
                this.setPos(pos.x, pos.y, this.z);
			
				// This object will control the alpha of all other objects..
				for(var i = 0; i < World._objects.length; i++)
				{
					var o = World._objects[i];
					if(o.z-o.bz/2 > this.z)
						o.alpha = 0.2;
					else
						o.alpha = 1.0;
				}
			}
			// fill screen with transparent tiling...
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
			
			this.createObjects = function(c, allow_compound)
			{
				World.addScan({
					pos : [this.x, this.y, this.z],
					size: [this.bx, this.by, this.bz],
					c: c,
					direction: this.direction,
					callback: function(objects)
					{
						// If CTRL is held, kill all objects beneath cursor
						// Otherwise only create if theres room
						var create = true;
						if(Key.get(KEY_CTRL))
						{
							$.each(objects, function(idx, obj){
								if(!obj.phantom)
								{
									World.removeObject(obj);
									World._editor.unsaved_changes = true;
								}
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
							if(	(this.size[0] != this.c.size[0] ||
								this.size[1] != this.c.size[1] ||
								this.size[2] != this.c.size[2]) && allow_compound)
							{
								// a huge object compound..
								newid = 'compound('+newid+','+Math.ceil(this.size[0])+','+Math.ceil(this.size[1])+','+Math.ceil(this.size[2])+')';
							}
							var obj = World.createObject(newid, this.pos, {fixed: true});
							obj.direction = this.direction;
							World._editor.unsaved_changes = true;
						}
					}
				});
			};
		},
		step: function()
		{
			var ctx = Graphics.ctx;
			var prevpos, prevsize;
			prevpos = [this.x, this.y, this.z];
			prevsize= [this.bx, this.by, this.bz];
			var we = World._editor;
			var wec = World._editor.classBrowser;
			var c = wec.classes[wec.selectedCategory][wec.selectedClass[wec.selectedCategory]].c;
			var csx = Math.ceil(c.size[0]);
			var csy = Math.ceil(c.size[1]);
			var csz = Math.ceil(c.size[2]);
			
			// whether to allow compound objects being created from this class type
			var allow_compound = !c.defaults.mass;
			
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
				this.bz = Math.abs(we.drag.z - we.layer.z)+1;

				this.bx -= ((csx-c.size[0]));
				this.by -= ((csy-c.size[1]));
				this.bz -= ((csz-c.size[2]));
				
				if(this.bx<c.size[0])this.bx=c.size[0];
				if(this.by<c.size[1])this.by=c.size[1];
				if(this.bz<c.size[2])this.bz=c.size[2];
				this.bx = Math.floor(this.bx/c.size[0])*c.size[0];
				this.by = Math.floor(this.by/c.size[1])*c.size[1];
				this.bz = Math.floor(this.bz/c.size[2])*c.size[2];

				xdir = sign(we.drag.x - we.layer.x);
				ydir = sign(we.drag.y - we.layer.y);
				zdir = sign(we.drag.z - we.layer.z - csz/2);
				
				this.x = we.drag.x - xdir * Math.max(0, this.bx/2-c.size[0]/2);
				this.y = we.drag.y - ydir * Math.max(0, this.by/2-c.size[1]/2);
				this.z = we.drag.z - zdir * Math.max(0, this.bz/2-c.size[2]/2);
				
				//this.z += Math.floor(c.size[2]/2);
				//this.z -= (csz-c.size[2])/2;
			}
			else
			{
				this.bx = c.size[0];
				this.by = c.size[1];
				this.bz = c.size[2];
				this.x = we.layer.x;
				this.y = we.layer.y;
				this.z = we.layer.z;//+c.size[2]/2;
				//this.z += Math.floor(c.size[2]/2);
				//this.z -= (csz-c.size[2])/2;
			}
			this.x += (csx-1)/2;
			this.y += (csy-1)/2;
			this.z += c.size[2]/2;

			// round x and y up..
			//var odd;
			//odd = 0.5 * (this.bx)
			
			//// fill bx,by,bz cuboid with sprites..
			for(var zz = 0; zz < this.bz; zz+=csz)
			for(var yy = 0; yy < this.by; yy+=csy)
			for(var xx = 0; xx < this.bx; xx+=csx)
			{
				var coords = Cuboid2Screen(
					this.x+xx-(this.bx/2)+c.size[0]/2,
					this.y+yy-(this.by/2)+c.size[1]/2, 
					this.z+zz-(this.bz/2)+c.size[2]/2, 
					csx,csy,csz);
				
				coords.x += 320-focus.x;
				coords.y += 240-focus.y;
			
				Graphics.ctx.globalAlpha = 0.5;
			
				
				if(Key.get(MOUSE_LEFT) && we.selectedObject != null)
				{
					draw({
						x: coords.x,
						y: coords.y,
						tilex: 2,
						tiley: 1,
						src: we.tileset.image
					});
				}
				else
				{
					var t = c.tiles;
					if(c.flags & World.DIRECTED)
						t = t[this.direction];
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
			/*
			ctx.fillStyle    = '#000';
			ctx.font         = '16px sans-serif';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';
			ctx.fillText  ('bx,by,bz: ('+this.bx+', '+this.by+', '+this.bz+') x,y,z: ('+this.x+', '+this.y+', '+this.z+')', 30, 80);

			ctx.fillText  ('mx,my: ('+focus.x+', '+focus.y+')', 30, 120);
			ctx.fillText  ('c.bx,by,bz: ('+JSON.stringify(c.size)+')', 30, 150);
			*/
			Graphics.ctx.restore();
			if(wec.open)
			{
				we.drag.dragging = false;
			}
			else
			{
				// Draw collision mask
				World.addScan({
					pos : [this.x, this.y, this.z],
					size: [this.bx, this.by, this.bz],
					callback: function(objects)
					{
						var we = World._editor;
						var focus = World2Screen(World._cameraPosX, World._cameraPosY, World._cameraPosZ);
						for(var i = 0; i < objects.length ; i++)
						{
							var obj = objects[i];
							if(obj.phantom)
								continue;
							
							// find cuboid of collision
							var bbx1 = this.x-this.bx/2;
							var bby1 = this.y-this.by/2;
							var bbz1 = this.z-this.bz/2;
							var bbx2 = this.x+this.bx/2;
							var bby2 = this.y+this.by/2;
							var bbz2 = this.z+this.bz/2;
							
							if(obj.x-obj.bx/2 > bbx1)
								bbx1 = obj.x-obj.bx/2;
							if(obj.y-obj.by/2 > bby1)
								bby1 = obj.y-obj.by/2;
							if(obj.z-obj.bz/2 > bbz1)
								bbz1 = obj.z-obj.bz/2;
							
							if(obj.x+obj.bx/2 < bbx2)
								bbx2 = obj.x+obj.bx/2;
							if(obj.y+obj.by/2 < bby2)
								bby2 = obj.y+obj.by/2;
							if(obj.z+obj.bz/2 < bbz2)
								bbz2 = obj.z+obj.bz/2;
								
							bbx1 = Math.floor(bbx1);
							bby1 = Math.floor(bby1);
							bbz1 = Math.floor(bbz1);
							bbx2 = Math.floor(bbx2);
							bby2 = Math.floor(bby2);
							bbz2 = Math.floor(bbz2);
							
							// draw top
							for(var y = bby1; y < bby2; y++)
							for(var x = bbx1; x < bbx2; x++)
							{
								var z = bbz2-1;
								var coords = World2Screen(x,y,z);
								coords.x += 320-focus.x;
								coords.y += 240-focus.y;
								draw({
									x: coords.x,
									y: coords.y, 
									tilex: 0, 
									tiley: 0, 
									src: we.tileset.image,
									tilew: 32,
									tileh: 32
								});
							}
							// draw left
							for(var z = bbz1; z < bbz2; z++)
							for(var x = bbx1; x < bbx2; x++)
							{
								var y = bby2-1;
								var coords = World2Screen(x,y,z);
								coords.x += 320-focus.x;
								coords.y += 240-focus.y;
								draw({
									x: coords.x,
									y: coords.y, 
									tilex: 1, 
									tiley: 0, 
									src: we.tileset.image,
									tilew: 32,
									tileh: 32
								});
							}
							// draw right
							for(var z = bbz1; z < bbz2; z++)
							for(var y = bby1; y < bby2; y++)
							{
								var x = bbx2-1;
								var coords = World2Screen(x,y,z);
								coords.x += 320-focus.x;
								coords.y += 240-focus.y;
								draw({
									x: coords.x,
									y: coords.y, 
									tilex: 2, 
									tiley: 0, 
									src: we.tileset.image,
									tilew: 32,
									tileh: 32
								});
							}
						}
					}
				});
								
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
							// No object was selected: start dragging here (or if compounds are disabled, start creating objects)
							if(allow_compound)
							{
								we.drag.x = we.layer.x;
								we.drag.y = we.layer.y;
								we.drag.z = we.layer.z;
								we.drag.dragging = true;
							}
						}
					});
				}
				else if(!Key.get(MOUSE_LEFT) && Key.changed(MOUSE_LEFT))
				{
					if(we.drag.dragging == true)
						this.createObjects(c, allow_compound);
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
								{
									World.removeObject(obj);
									World._editor.unsaved_changes = true;
								}
							});
						}
					});
				}
				else if(Key.get(MOUSE_LEFT) && !allow_compound)
				{
					// special (=scripted) objects are created this way...
					this.createObjects(c, allow_compound);
				}
				
				if(Key.get(MOUSE_LEFT) && !Key.changed(KEY_LEFT) && we.selectedObject != null)
				{
					// While holding down, make selected object follow cursor
					we.selectedObject.setPos(
						this.x + we.selectionOffsetX,
						this.y + we.selectionOffsetY,
						this.z + we.selectionOffsetZ);
					World._editor.unsaved_changes = true;
				}
			}
			
			// change direction based on mouse movement
			var delta = [
				(this.x - prevpos[0]),
				(this.y - prevpos[1]),
				(this.z - prevpos[2])
			];
			
			var delta_abs = [
				Math.abs(delta[0]),
				Math.abs(delta[1]),
				Math.abs(delta[2])
			];
			
			if(delta_abs[0] > delta_abs[1])
			{
				this.direction = (delta[0]>0)?1:3;
			}
			else if(delta_abs[0] < delta_abs[1])
			{
				this.direction = (delta[1]>0)?2:0;
			}
			
			if(this.x != prevpos[0] || this.y != prevpos[1] || this.z != prevpos[2] ||
			   this.bx != prevsize[0] || this.by != prevsize[1] || this.bz != prevsize[2])
				this.dirty = true;
		}
	});
	// Add an arrow class to show directions.. 
	World.addClass('E_arrow',
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
			var wec = World._editor.classBrowser;
			var c = wec.classes[wec.selectedCategory][wec.selectedClass[wec.selectedCategory]].c;
			if(!(c.flags & World.DIRECTED))
				return;
			var g = World._editor.ghost;
			var target = [g.x, g.y, g.z];
			
			this.setPos(target);
			
			var focus = World2Screen(World._cameraPosX, World._cameraPosY, World._cameraPosZ);
			var frame = 0;
			
			// flicker!
			frame = g.direction * 2 + (Math.floor((new Date()).getTime()/500)%2==0);
			
			var coords = World2Screen(this.x, this.y, this.z);

			coords.x += 320-focus.x;
			coords.y += 240-focus.y;
			
			draw({
				x: coords.x, 
				y: coords.y, 
				tilex: frame, 
				tiley: 2, 
				src: World._editor.tileset.image
			});
		}
	});
	// This class draws extra surfaces around the proxy/ghost object helping with object positioning
	World.addClass('E_surface',
	{
		internal: true, // prevents visibility in class browser
		init: function(params)
		{
			this.axis = params.axis;
			this.tilex = 
				(this.axis[2] != 0)?3:(
				(this.axis[1] != 0)?4:5);
			this.hidden = true;
		},
		step: function()
		{
			var g = World._editor.ghost;

			// Scan for collisions with scene
			var dist = 20; //
			
			var pos = [g.x,g.y,g.z];
			var size = [0,0,0];

			for(var i = 0; i < 3 ; i++)
			{
				if(this.axis[i] != 0)
				{
					pos[i] += (dist/2 + [g.bx,g.by,g.bz][i]/2) * this.axis[i];
					size[i] = dist;
				}
				else
				{
					size[i] = [g.bx,g.by,g.bz][i];
				}
			}

			World.addScan({
				pos : pos,
				size: size,
				surface: this,
				callback: function(objects)
				{
					var we = World._editor;
					
					var mind = 0;
					var first = true;
					var g = World._editor.ghost;
					var ax = (this.surface.axis[0]!=0)?0:(this.surface.axis[1]!=0?1:2);
					for(var i = 0; i < objects.length; i++)
					{
						var o = objects[i];
						if(o.phantom)continue;

						var d = this.surface.axis[ax]*([o.x,o.y,o.z][ax] - this.surface.axis[ax] * [o.bx,o.by,o.bz][ax]/2 - [g.x,g.y,g.z][ax]);

						if(d < 0)
						{
							// Inside an object...
							this.surface.hidden = true;
							return;	
						}

						if(d < mind || first)
						{
							first = false;
							mind = d;	
						}
					}
					
					var p = [g.x,g.y,g.z];
					var s = [Math.ceil(g.bx),Math.ceil(g.by),Math.ceil(g.bz)];
					p[ax] += (mind+[g.bx,g.by,g.bz][ax]/2) * this.surface.axis[ax] / 2;
					s[ax] = mind-[g.bx,g.by,g.bz][ax]/2;
					this.surface.setPos(p);
					this.surface.setSize(s);
					this.surface.hidden = first||this.dirty; // hide if nothing was found or still have a render graph to rebuild..
				}
			});

			if(this.hidden)
			{
				// Just to make sure we're out of sight..
				return;
			}

			var focus = World2Screen(World._cameraPosX, World._cameraPosY, World._cameraPosZ);
			
			size = [this.bx,this.by,this.bz];
			pos = [this.x,this.y,this.z];
			
			var ax = (this.axis[0]!=0)?0:(this.axis[1]!=0?1:2);
			pos[ax] += this.axis[ax]*size[ax]/2;
			size[ax] = 1;
			
			for(var zz = 0; zz < size[2] || zz==0; zz+=1)
			for(var yy = 0; yy < size[1] || yy==0; yy+=1)
			for(var xx = 0; xx < size[0] || xx==0; xx+=1)
			{
				var coords = World2Screen(pos[0]+xx-size[0]/2, pos[1]+yy-size[1]/2, pos[2]+zz-size[2]/2);
				coords.x += 320-focus.x;
				coords.y += 240-focus.y;
				draw({
					x: coords.x, 
					y: coords.y, 
					tilex: this.tilex, 
					tiley: 0,
					src: World._editor.tileset.image
				});
			}
			
			World.drawHighlight(this);
		}
	});
	var layer = World.createObject('E_layer', [0,0,0.5], {
		phantom: true
	});
	var ghost = World.createObject('E_ghost', [0,0,0], {
		phantom: true
	});
	World.createObject('E_arrow', [0,0,0], {
		phantom: true
	});
	$.each([	[1,0,0],[-1,0,0],
				[0,1,0],[0,-1,0],
				[0,0,1],[0,0,-1]
		], function(idx, val){
		World.createObject('E_surface', [0,0,0], {
			phantom: true,
			axis: val
		});
	});
	
	var we = World._editor;
	
	we.layer = layer;
	we.ghost = ghost;
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
			var err = 0.999; // avoid rounding errors.. 
			p.d = (o.x + o.y + o.z) + ((p.begin==true)?-1:1) * err*(o.bx+o.by+o.bz)/2;
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
						if(typeof(val.callback) == 'undefined')
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
								p.result.push(b);
						}
					});
				}
				$.each(objectbuffer, function(key, val){
					if(typeof(val.callback) != 'undefined')
					{
						// verify val collides p...
						if(typeof(p.callback) == 'undefined')
						{
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
			val.obj.callback.call(val.obj, val.result); // ?? 
		});
		
	}
	// Draw class browser..
	var wec = we.classBrowser;
	if(Key.get(KEY_SPACE))
	{
		wec.open = true;
		if(wec.alpha < 1.0)
			wec.alpha = (wec.alpha+1.0)/2;
		
		// keyboard selection
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
		// mouse selection
		//ctx.fillStyle = 'white';
		//ctx.fillText  ('Mouse: '+World.mouseX + ', ' + World.mouseY, 0,0);
		if(Key.get(MOUSE_LEFT) && Key.changed(MOUSE_LEFT))
		{
			var dy = Math.floor((World.mouseY - 240) / 32);  
			var dx = Math.floor((World.mouseX - 320) / 32);

			// its important we change category first...
			wec.selectedCategory = wrap(wec.selectedCategory+dy, wec.classes.length);
			wec.selectedClass[wec.selectedCategory] = 
				wrap(wec.selectedClass[wec.selectedCategory] + dx,
				wec.classes[wec.selectedCategory].length);
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
		
		var cl = wec.classes[wec.selectedCategory][wec.selectedClass[wec.selectedCategory]];
		
		ctx.globalAlpha = wec.alpha;
		ctx.fillStyle = 'black';
		
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
				var ty = wrap(y-wec.selectedCategory+Math.floor(wec.classes.length/2), wec.classes.length)-Math.floor(wec.classes.length/2);
				
				tx = tx*32+320;
				ty = ty*32+240;
				
				var a = 0.50;
				c.x = (c.x*a+tx*(1.0-a));
				c.y = (c.y*a+ty*(1.0-a));
				if(Math.abs(c.x-tx)<1)c.x=tx;
				if(Math.abs(c.y-ty)<1)c.y=ty;
				
				// change color if mouse is close
				var mx = World.mouseX;
				var my = World.mouseY;
				if(mx >= c.x && mx < c.x+32 && my > c.y && my < c.y+32)
				{
					ctx.fillStyle = 'red';
				}
				else
				{
					ctx.fillStyle = 'black';
				}
				
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











