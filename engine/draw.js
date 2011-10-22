/*
	Utility functions related to drawing
*/

function draw(opts)
{
	// target pos: opts.x, opts.y
	// 
	
	// If no canvas context was specified, use the main canvas
	if(typeof(opts.dest) == 'undefined')opts.dest = World._ctx;
	if(typeof(opts.tilew) == 'undefined')opts.tilew=32;
	if(typeof(opts.tileh) == 'undefined')opts.tileh=32;
	
	if(opts.x+opts.tilew<0||opts.y+opts.tileh<0||opts.x-opts.tilew>opts.dest.width||opts.y-opts.tileh>opts.dest.height)return;
	
	opts.dest.drawImage(
		opts.src, 
		32*opts.tilex, 32*opts.tiley,	
		opts.tilew, opts.tileh,
		Math.round(opts.x), Math.round(opts.y),
		opts.tilew, opts.tileh
	);
}

World.drawBackground = function()
{
		// Clears the screen with a suitable color, renders clouds, etc.			
		// Update world sky color based on camera position
		
		var ctx = World._ctx;
		var h = World._cameraPosZ;
		// Color at zero height
		
		h /= 5000;
		h+=0.85;
		
		if(h<0)h=0;
		if(h>1)h=1;	
		
		World.background.scene.draw(ctx, 1.0-h);
		//var camerapos = World2Screen(World._cameraPosX, World._cameraPosY, World._cameraPosZ);
		
		var b = World.background;
		
		if(b.clouds.length == 0)
		{
			// divide sky into slots..
			var dx = 3;
			var dy = 2;
			for(var y = 0; y < dy; y++)
			for(var x = 0; x < dx; x++)
			{
				var d = y%2*0.5;
				var xx = 640/dx*(x+d);
				var yy = 480/dy*y;
				var wm = 640/dx;
				var hm = 480/dy;
				
				
				var w = Math.floor(wm/4+Math.random()*wm/4*3);
				var h = Math.floor(hm/4+Math.random()*hm/4*3);
				
				var xpos = Math.floor(xx+(wm-w)*Math.random());
				var ypos = Math.floor(yy+(hm-h)*Math.random());
				b.clouds.push(new Effects.Clouds(xpos,ypos,w,h));
			}
		}
		ctx.globalAlpha = h*h*h;
		for(var i = 0; i < b.clouds.length; i++)
		{
			b.clouds[i].draw(ctx);
		}
		ctx.globalAlpha = 1;
};

World.drawObject = function(obj)
{
	// Check whether the object is simple or complex
	// In editor every object is drawn without side effects (unless theyre internal)
	if((World._editor.online == false||obj.shape.internal)&&'step' in obj.shape)
		obj.shape.step.call(obj);
	else
		World.drawSimpleObject(obj);
}

World.drawHighlight = function(obj)
{
	// draw transparent coolish planes around the object to make it appear significant
	var ctx = World._ctx;
	ctx.save();
	
	ctx.globalAlpha = 0.5;
	
	var o = {
		x: obj.x,
		y: obj.y,
		z: obj.z,
		bx: obj.bx,
		by: obj.by,
		bz: obj.bz
	};
	
	var focus = World2Screen(World._cameraPosX, World._cameraPosY, World._cameraPosZ);
	var coords = Cuboid2Screen(o.x, o.y, o.z, o.bx, o.by, o.bz);
	
	coords.x += 320-focus.x;
	coords.y += 240-focus.y;
	
	ctx.fillStyle = 'yellow';
	ctx.lineWidth = 2;
	ctx.strokeStyle = 'yellow';
	
	// Find origin:
	var zero = {
		x: (o.by)*16,
		y: (o.bz-1)*16
	};
	
	var corners = [
		[zero.x, 0],
		[coords.w, 8*o.bx],
		[coords.w-zero.x, 8*(o.bx+o.by)],
		[0, 8*o.by],
		[0, 8*o.by + o.bz*16],
		[coords.w-zero.x, 8*(o.bx+o.by) + o.bz*16],
		[coords.w, 8*o.bx+o.bz*16]
	];
	for(var i = 0; i < 7; i++)
	{
		corners[i][0]+=coords.x;
		corners[i][1]+=coords.y;
	}
	
	ctx.beginPath();
	ctx.moveTo(corners[0][0],corners[0][1]);
	ctx.lineTo(corners[1][0],corners[1][1]);
	ctx.lineTo(corners[2][0],corners[2][1]);
	ctx.lineTo(corners[3][0],corners[3][1]);
	ctx.closePath();
	ctx.stroke();
	
	ctx.beginPath();
	ctx.moveTo(corners[2][0],corners[2][1]);
	ctx.lineTo(corners[3][0],corners[3][1]);
	ctx.lineTo(corners[4][0],corners[4][1]);
	ctx.lineTo(corners[5][0],corners[5][1]);
	ctx.closePath();
	ctx.stroke();
	
	ctx.beginPath();
	ctx.moveTo(corners[1][0],corners[1][1]);
	ctx.lineTo(corners[2][0],corners[2][1]);
	ctx.lineTo(corners[5][0],corners[5][1]);
	ctx.lineTo(corners[6][0],corners[6][1]);
	ctx.closePath();
	ctx.stroke();
	
	ctx.restore();
}

World.drawSimpleObject = function(obj, transparency)
{
	if(!obj.visible)
		return;
	if(obj.alpha <= 0.0001)
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
	var ctx = World._ctx;
	var coords = Cuboid2Screen(obj.x, obj.y, obj.z, Math.ceil(obj.bx), Math.ceil(obj.by), Math.ceil(obj.bz));

	coords.x += 320-focus.x;
	coords.y += 240-focus.y;

	ctx.globalAlpha = obj.alpha;
	draw({
		x: coords.x, 
		y: coords.y, 
		tilex: g[0], 
		tiley: g[1],
		tilew: coords.w,
		tileh: coords.h,
		src: obj.shape.tileset.image
	});
	
	ctx.globalAlpha = 1;
	
/*	World._ctx.strokeStyle = 'red';
	
	var rect = Cuboid2Screen(obj.x,obj.y,obj.z,obj.bx,obj.by,obj.bz);
	rect.x += 320-focus.x;
	rect.y += 240-focus.y;
	World._ctx.strokeRect(rect.x,rect.y,rect.w,rect.h);*/
};

/*
	Generate a hidden canvas with target_count random tiles by sampling randomly thru source_tiles
*/
World.sampleTiles = function(source, target_count, source_tiles)
{
	var w = target_count * 32;
	var h = 32;
	
	var c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	$(World._cache).append(c);
	var ctx = c.getContext('2d');
	
	var imagedata = ctx.getImageData(0,0,w,h);
	
	var tiles_data = [];
	for(var i = 0; i < source_tiles.length; i++)
	{
		var s = source_tiles[i];
		var temp = document.createElement('canvas');
		temp.width = w;
		temp.height = h;
		var tempc = temp.getContext('2d');
		tempc.drawImage(source.image,s[0]*32,s[1]*32,32,32,0,0,32,32);
		tiles_data.push(tempc.getImageData(0,0,32,32));
	}
	
	for(var i = 0; i < target_count; i++)
	{
		var ratios = [];
		var sum = 0;
		for(var a = 0; a < source_tiles.length; a++)
		{
			ratios.push(Math.random()*Math.random()*10+0.1);
			sum += ratios[ratios.length-1];
		}
		for(var y = 0; y < 32; y++)
		for(var x = 0; x < 32; x++)
		{
			var target_ind = (y)*4*w+(x+i*32)*4;
			var source_ind = (y)*4*32+x*4;
			
			for(var f = 0; f < 4; f++)
			{
				var val = 0;
				for(var a = 0; a < source_tiles.length; a++)
				{
					val += tiles_data[a].data[source_ind+f]*ratios[a];
				}
				val /= sum;
				imagedata.data[target_ind+f] = val;
			}
		}
	}
	ctx.putImageData(imagedata,0,0);
	
	return {
		image: c
	};
}



