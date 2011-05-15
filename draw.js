/*
	Utility functions related to drawing
*/

function draw(x, y, tilex, tiley, source, dest)
{
	// If no canvas context was specified, use the main canvas
	if(!dest)dest = Graphics.ctx;
	if(x+32<0||y+32<0||x-32>640||y-32>480)return;
	
	dest.drawImage(
		source, 
		32*tilex, 32*tiley,	
		32, 32,
		Math.floor(x), Math.floor(y),
		32, 32
	);
}

function progressbar(current, max, message)
{
	var w = 640;
	var h = 480;

	var ctx = Graphics.ctx;

	ctx.fillStyle = 'black';
	ctx.globalAlpha = 0.2;
	ctx.fillRect (0, 0, 640, 480);		
	ctx.globalAlpha = 1.0;
	
	ctx.fillStyle = 'black';
	Graphics.ctx.fillRect(w/4,h/4,w/2,h/2);
	ctx.fillStyle = 'red';
	Graphics.ctx.fillRect(w/4+50,h/4+50,(w/2-100)*current/max,h/2-100);

	// Force redraw of canvas..
	document.getElementById('canvas').style.opacity = 1.0-0.001*Math.random();
}

World.drawBackground = function()
{
		// Clears the screen with a suitable color, renders clouds, etc.			
		// Update world sky color based on camera position
		
		var h = World._cameraPosZ;
		// Color at zero height
		
		h+=100;
		h /= 100;
		
		if(h<0)h=0;
		if(h>1)h=1;	
		
		World.background.scene.draw(Graphics.ctx, 1.0-h);
		//var camerapos = World2Screen(World._cameraPosX, World._cameraPosY, World._cameraPosZ);
		
};

World.drawObject = function(obj)
{
	// Check whether the object is simple or complex
	if('step' in obj.shape)
		obj.shape.step.call(obj);
	else
		World.drawSimpleObject(obj);
}

World.drawSimpleObject = function(obj)
{
	if(!obj.visible)
		return;

	var g = obj.shape.tiles;
	if((obj.shape.flags & World.DIRECTED))
	{
		g = g[obj.direction];
	}
	
	if((obj.shape.flags & World.ANIMATED) || (obj.shape.flags & World.ANIMATED_RANDOM))
	{
		// Increment frame tick counter
		obj.frameTick ++;
		if(obj.frameTick >= Math.abs(obj.frameMaxTicks) && obj.frameMaxTicks != 0)
		{
			obj.frameTick = 0;
			if(obj.shape.flags & World.ANIMATED_RANDOM)
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
	
	Graphics.ctx.globalAlpha = obj.alpha;
	draw(coords.x, coords.y, g[0] ,g[1], obj.shape.tileset.image);
	Graphics.ctx.globalAlpha = 1;
	/*Graphics.ctx.strokeStyle = 'red';
	
	var rect = Cuboid2Screen(obj.x,obj.y,obj.z,obj.bx,obj.by,obj.bz);
	rect.x += 320-focus.x;
	rect.y += 240-focus.y;
	Graphics.ctx.strokeRect(rect.x,rect.y,rect.w,rect.h);*/
};

