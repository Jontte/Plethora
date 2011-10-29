/*
 * TubeWorks module
 * Version 0.1
*/

World.addModule('TubeWorks',
{
	preload: ['img/mod_tubeworks.png'],
	load : function()
	{
		// Define a couple of flow-managing helper functions
		function init_flow(obj, volume)
		{
			obj.tube = {
				contain: 0,
				connections: [null,null,null,null,null,null], // for each 6 sides [flow parameters, object instance handle]
				initialized: false
			};
		}
		function step_flow(obj)
		{
			// try balancing
			if(!obj.tube.initialized)
			{
				obj.tube.initialized = true;
				
				// scan neighbourhood for other connectable objects..
				// TODO: ugly
				for(var i = 0; i < World._objects.length; i++)
				{
					var epsilon = 0.001;
					var o = World._objects[i];
					var t = obj.tube.connections;
					if(	o != obj && typeof(o.tube) == 'object')
					{
						var p = [1, o];
                        
                        var dx = obj.x-o.x;
                        var dy = obj.y-o.y;
                        var dz = obj.z-o.z;
                        var mx = (obj.bx+o.bx)/2;
                        var my = (obj.by+o.by)/2;
                        var mz = (obj.bz+o.bz)/2;
                        if(Math.abs(dy) < my && Math.abs(dz) < mz)
                        {
                            if(Math.abs(dx-mx) < epsilon)
                                t[0] = p;
                            else if(Math.abs(dx+mx) < epsilon)
                                t[3] = p;
                        }
                        if(Math.abs(dz) < mz && Math.abs(dx) < mx)
                        {
                            if(Math.abs(dy-my) < epsilon)
                                t[1] = p;
                            else if(Math.abs(dy+my) < epsilon)
                                t[4] = p;
                        }
                        if(Math.abs(dx) < mx && Math.abs(dy) < my)
                        {
                            if(Math.abs(dz-mz) < epsilon)
                                t[2] = p;
                            else if(Math.abs(dz+mz) < epsilon)
                                t[5] = p;
                        }
					}
				}
			}
		}
		
		// Load tiles and graphics
		var tiles = World.addTileset('img/mod_tubeworks.png');
		
		
		World.addClass('tube', {
			tileset: tiles,
			category: 'tubeworks',
			tiles: [0,0],
			init: function(params)
			{
				init_flow(this, 1);
			},
			step: function()
			{
				step_flow(this);
				
				// custom drawing function...
				if(!this.visible || this.alpha <= 0.0001)
					return;
				var focus = World2Screen(World._cameraPosX, World._cameraPosY, World._cameraPosZ);
				var ctx = World._ctx;
				var coords = Cuboid2Screen(this.x, this.y, this.z, Math.ceil(this.bx), Math.ceil(this.by), Math.ceil(this.bz));

				coords.x += 320-focus.x;
				coords.y += 240-focus.y;
				ctx.globalAlpha = this.alpha;
				function draw_part_with_flow(tile, pos, flow, src)
				{
					var ofx = 0;
					var ofy = 0;
					if(tile == 0) {
						ofx += 8*pos;
						ofy += 4*pos;
					}
					else if (tile == 1) {
						ofx -= 8*pos;
						ofy += 4*pos;
					}
					else {
						ofy -= 8*pos;
					}
					draw({
						x: coords.x+ofx, 
						y: coords.y+ofy, 
						tilex: tile, 
						tiley: 0,
						tilew: coords.w,
						tileh: coords.h,
						src: src.image
					});
				}
				
                var c = this.tube.connections;
                var hub_tile = 3;
                var ax = null;
                for(var i = 0; i < 6; i++)
                {
                    if(c[i] != null)
                    {
                        if(ax==null)
                        {
                            ax=i%3;
                            hub_tile = ax;
                        }
                        else if(ax != i % 3)
                        {
                            hub_tile = 3;
                            break;
                        }
                    }
                }
				for(var i = 0; i < 6; i++)
                {
                    if(i==3)
                        draw({
                            x: coords.x,
                            y: coords.y,
                            tilex: hub_tile,
                            tiley: 0,
                            tilew: coords.w,
                            tileh: coords.h,
                            src: this.shape.tileset.image
                        });
					if(c[i] != null)
						draw_part_with_flow([0,1,2][i%3], i>=3?1:-1, c[i][0], this.shape.tileset);
                }
				
				
				ctx.globalAlpha = 1;
			}
		});
	}
});

