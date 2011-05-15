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


if(!World)World = {};
World.drawBackground = function()
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

