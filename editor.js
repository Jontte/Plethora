/*
	Editor-related JS functionality
*/

World.initEditor = function()
{
	var plethora_original = World.addTileset('tileset.png');	
	World.addClass('E_layer',
	{
		tileset: plethora_original,
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
				var d = Math.max(Math.abs(x-7),Math.abs(y-7));
				Graphics.ctx.globalAlpha = 1.0-d/7;
				var coords = World2Screen(this.x+x-7, this.y+y-7, this.z);

				coords.x += 320-focus.x;
				coords.y += 240-focus.y;
				
				var c = [1,11];
				if(x == 7 && y == 7)
					c = [2,11];
				draw(coords.x, coords.y, c[0], c[1], this.shape.tileset.image);
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
				this.z++;
			if(Key.changed(KEY_DOWN) && Key.get(KEY_DOWN))
				this.z--;
			
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
	
	World.createObject('E_layer', [0,0,-0.5], [1,1,1], {
		fixed: false
	});
}

