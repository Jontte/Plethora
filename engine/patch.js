
/*
 * The patch manager is responsible for finding large, continuous areas of
 * static objects and prerendering them to a hidden canvas so that they can 
 * be rendered faster.
 *
 * WIP.
 */

Patch = {
	_buffers : [],
	_objects : [],
	_dirty : false,
	reset : function()
	{
		Patch._buffers = [];
		Patch._objects = [];
		Patch._dirty   = false;
	},
	createBuffer : function(w,h){		   
		var canvas = document.createElement('canvas');
		canvas.setAttribute("width", w);
		canvas.setAttribute("height", h);
		document.getElementById("cache").appendChild(canvas);
		canvas = G_vmlCanvasManager.initElement(canvas);
		
		var obj = {
			canvas: canvas,
			ctx: canvas.getContext('2d')
			width: w,
			height: h
		};
		Patch._buffers.push(obj);
		return obj;
	},
	maybeRebuild : function()
	{
		if(Patch._dirty == true)
		{
			Patch.buildCache();
		}
	},
	
	addToCache : function(obj){
		Patch._objects.push(obj);
		Patch._dirty = true;
	},
	
	buildCache : function(obj){
		Patch._dirty = false;
		/*
		 * This is where we do the magic..
		 *
		 * 1.  */			 
		 
		 
		 // Sort objects by depth
		 Patch._objects.sort(function(a,b){
			return (a.pos[0]+a.pos[1]+a.pos[2]) - (b.pos[0]+b.pos[1]+b.pos[2]);
		 });
		 
		 console.log('begin');
		 
		 var bins = {}
		 var currentdepth = -10e99;
		 var currentcanvas = Patch.createBuffer(640,480);
		 
		 for(var i = 0; i < Patch._objects.length; i++)
		 {
			var obj = Patch._objects[i];
			var d = (obj.pos[0]+obj.pos[1]+obj.pos[2]);
			
			
			
			if(d != current)
			{
			}
		 }
		 
		 console.log('end');
	}
};


