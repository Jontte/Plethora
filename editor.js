/*
	Editor-related JS functionality
*/

World.initEditor = function()
{
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
			Graphics.ctx.globalAlpha = 1.0;
			Graphics.ctx.strokeStyle = 'red';
			var rect = Cuboid2Screen(this.x,this.y,this.z,this.bx,this.by,this.bz);
			rect.x += 320-focus.x;
			rect.y += 240-focus.y;
			Graphics.ctx.strokeRect(rect.x,rect.y,rect.w,rect.h);
			
			Graphics.ctx.restore();
			
			
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
			var pos = Screen2WorldXY(World.mouseX-320, World.mouseY-240, this.z-0.5);
			this.x = pos.x;
			this.y = pos.y;
			
			// This object will control the alpha of all other objects..
			
			for(var i = 0; i < World._objects.length; i++)
			{
				var o = World._objects[i];
				if(o.z-o.bz/2 > this.z || o.z+o.bz/2 <= this.z)
					o.alpha = 0.2;
				else
					o.alpha = 1.0;
			}
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
			
			if(World._editor.classList.length > 0)
			{
				Graphics.ctx.globalAlpha = 0.5;
				var c = World._editor.classList[World._editor.selectedClass];
				var t = c.tiles;
				while(typeof(t[0]) != 'number')t = t[0];
				draw(coords.x, coords.y, t[0], t[1], c.tileset.image);
			}
			Graphics.ctx.restore();
		}
	});
	var layer = World.createObject('E_layer', [0,0,-0.5], [1,1,1], {
		fixed: false
	});
	World.createObject('E_ghost', [0,0,0], [1,1,1], {
		fixed: false,
		user: {
			layer: layer
		}
	});
	
	World._editor.layer = layer;
	World._editor.selectedClass = 0;
	
	World._editor.classList = [];
	$.each(World._classes, function(id, val){
		if(typeof(val.internal) === 'undefined')
			World._editor.classList.push(val);
	});			
}

World.editorStep = function()
{
	// Draw class browser..
	var we = World._editor;
	
	if(we.classList.length > 0)
	{
		// draw background for classbrowser
		var ctx = Graphics.ctx;
		ctx.fillStyle = 'black';
		ctx.fillRect(0,480-32,640,32);		
	
		var classcount = 640/32;
		for(var i = 0 ; i < classcount; i++)
		{
			var index = i - classcount / 2 ;
			var ci = we.selectedClass + index;
			while(ci < 0)ci+=we.classList.length;
			while(ci >= we.classList.length)ci-=we.classList.length;
			var c = we.classList[ci];
		
			if(index == 0)
			{
				ctx.fillStyle = 'red';
				ctx.fillRect(320, 480-32, 32, 32);
				
				ctx.fillStyle    = '#000';
				ctx.font         = '16px sans-serif';
				ctx.textBaseline = 'bottom';
				ctx.fillText  ('Class: '+c.id, 320, 480-32);
			}
			// We do this so that we get the first frame of the animation
			var t = c.tiles;
			while(typeof(t[0]) != 'number')t = t[0];
			
			draw(i*32, 480-32, t[0], t[1], c.tileset.image);
		}
	
		if(Key.get(KEY_LEFT) && Key.changed(KEY_LEFT))
		{
			we.selectedClass -= 1;
		}
		else if(Key.get(KEY_RIGHT) && Key.changed(KEY_RIGHT))
		{
			we.selectedClass += 1;
		}
		// Sanitize
		we.selectedClass = (we.selectedClass+we.classList.length)%we.classList.length;
	
	
		// If mouse is clicked, add object here...
		if(Key.changed(MOUSE_LEFT))
		{
			//alert('add');
			var c = we.classList[we.selectedClass];
			World.createObject(c.id, [we.layer.x, we.layer.y, we.layer.z+0.5], [1,1,1], {fixed: true});
		}
	}
}











