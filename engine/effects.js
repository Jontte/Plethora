
Effects = {

// The clouds effect uses a hidden canvas for faster rendering..
Clouds: function(x, y, w, h)
{
	var ratio = 16/9; // haha, widescreen clouds
	this.x = x;
	this.y = y;

	if(w/h > ratio)
	{
		var ww = w;
		w = h*ratio;
		x += ww/2-w/2;
	}
	else
	{
		var hh = h;
		h = w/ratio;
		y += hh/2-h/2;
	}
	
	this.canvas = document.createElement('canvas');
	this.canvas.width = w+40;
	this.canvas.height = h+40;
	$(World._cache).append(this.canvas);
	var ctx = this.canvas.getContext('2d');
	
	var bubblecount = (Math.floor(Math.random()*3)+4);
	
	ctx.beginPath();
	for(var i = 0; i < bubblecount; i++)
	{
		var d = Math.floor(Math.random()*(w<h?w:h)*(0.5*i/bubblecount));
		var rad = (w<h?w:h)/2 - d;
		
		var mx = Math.floor(Math.random()*(w-rad*2));
		var my = Math.floor(Math.random()*(h-rad*2));

		ctx.arc(rad+mx+20, rad+my+20, rad, 0, Math.PI*2, true);
	}

	ctx.closePath();
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 5;
	ctx.shadowBlur = 20;
	ctx.shadowColor = 'black';
	ctx.fillStyle = 'black';
	ctx.fill();
	var my_gradient = ctx.createLinearGradient(0,10+h/4,0,10+h/4*3);
	my_gradient.addColorStop(0, "white");
	my_gradient.addColorStop(1, "#AAAAAA");
	ctx.fillStyle = my_gradient;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;
	ctx.shadowBlur = null;
	ctx.shadowColor = null;
	ctx.fill();

	this.draw = function(ctx){
		ctx.drawImage(this.canvas, this.x-20, this.y-20);
	}
},

Mountains: function(x, y, w, h)
{
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	var min = 0;
	var max = h/2;
	this.points = [[0, Math.random()*max]];
	var step = 1;
	for(var xx = 0; xx <= w; xx += step)
	{
		var py = this.points[this.points.length-1][1];

		var dir = Math.round(Math.random());

		var ny = 0;
		var weighted_rand = 0.5+(Math.random()-Math.random())/2;
		if(dir == 0)
		{
			var maxstep = Math.abs(py-max);
			step = weighted_rand*maxstep;
			if(xx+step>w)step=w-xx+1;
			ny = py + step;
		}
		else
		{
			var maxstep = Math.abs(py-min);
			step = weighted_rand*maxstep;
			if(xx+step>w)step=w-xx+1;
			ny = py - step;
		}
		var nx = xx + step;
		this.points.push([nx,ny]);
	}	
	this.draw = function(ctx, phase){
		var d = phase;
		if(!d)d=0;
		var p = d*1.5-0.1;
		if(p>1) p = 1;
		if(p<0) p = 0;
		ctx.save();
		ctx.beginPath();
		for(var i = 0; i < this.points.length; i++)
			ctx.lineTo(this.x+this.points[i][0], this.y+this.points[i][1]);
		ctx.lineTo(this.x+this.w,this.y+this.h);
		ctx.lineTo(this.x,this.y+this.h);
		ctx.closePath();
		var my_gradient = ctx.createLinearGradient(0,this.y,0,this.y+this.h);
		my_gradient.addColorStop(0, "white");
		var mycolor = 'rgb(64,127,127)';
		my_gradient.addColorStop(0.25*(1-p), mycolor);
		my_gradient.addColorStop(0.75*(1-p), mycolor);
		my_gradient.addColorStop((1-p), "black");
		my_gradient.addColorStop(1, "black");
		ctx.fillStyle = my_gradient;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.shadowBlur = 0;//20;
		ctx.shadowColor = 'black';
		ctx.fill();

		ctx.shadowBlur = 0;
		ctx.shadowColor = null;

		var s = this.h/30;
		ctx.beginPath();
		for(var i = 0; i < this.points.length-1; i++)
		{
			var dy = this.points[i+1][1]-this.points[i][1];
			if(dy<0)
			{
				ctx.moveTo(this.x+this.points[i][0], this.y+this.points[i][1]+s);
				ctx.lineTo(this.x+this.points[i+1][0], this.y+this.points[i+1][1]+s);
			}
		}
		ctx.closePath();
		ctx.strokeStyle = 'white';
		ctx.lineWidth = s*0.75;
		ctx.lineCap = 'round';
		ctx.globalCompositeOperation = 'lighter';
//		ctx.globalAlpha = 0.5;
		ctx.stroke();
		ctx.restore();
	}
},

SunsetBackground: function(x, y, w, h)
{
	this.objs = [];
	this.h = h;
	for(var i = 0; i < 10; i++)
	{
		this.objs.push(new Effects.Mountains(0,0,w,100));
	}
	this.draw = function (ctx, phase)
	{
		ctx.save();
		var d = phase;
		
		var midpoint = [96,127,255];
		var sunset = [255,127,0];
		var sundown = [0,0,0];
		var c = [0,0,0];
		for(var i = 0; i < 3 ; i++)
		{
			c[i] = (1.0-Math.abs(d-0.5))*2*midpoint[i];
			
			var cc = 0;
			
			cc = 1.0-Math.abs(0.8-d)*2;
			if(cc<0)cc=0;
			c[i] = c[i]+(sundown[i]-c[i])*cc;
			
			cc = 1.0-Math.abs(0.5-d)*8;
			if(cc<0)cc=0;
			c[i] = c[i]+(sunset[i]-c[i])*cc;
			
			
			c[i] = Math.round(c[i]);
		}	
		ctx.fillStyle = 'rgba('+c[0]+','+c[1]+','+c[2]+',255)';
		ctx.fillRect(0,0,800,600);
		
		// draw the sun..
		
		var sunx = 100;
		var suny = -100+d*2*400;
		
		if(suny > -50)
		{
			ctx.beginPath();
			ctx.arc(sunx,suny,50,0,Math.PI*2, true);
			ctx.closePath();
			ctx.fillStyle = 'yellow';
			ctx.fill();
		}
		for(var i = 0; i < this.objs.length; i++)
		{
		
			var p = (this.objs.length-i)/this.objs.length;
		
			var y = 700*(2/5-(d*2-1)/(2*p+0.2));
	
			if(y>this.h)continue;
			
			ctx.save();					
			ctx.translate(0,y);
			this.objs[i].draw(ctx, d);
			ctx.restore();
		
			if( i == 0 || i == this.objs.length-1 )
			{
				ctx.fillStyle = 'black';
				ctx.shadowOffsetX = 0;
				ctx.shadowOffsetY = 0;
				ctx.shadowBlur = null;
				ctx.shadowColor = null;
				ctx.fillRect(0,y+99,800,600-(y+99));
			}
		}
		ctx.restore();
	}
}

}
