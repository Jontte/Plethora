/*
 * PlethoraOriginal module
 * Version 1.0
*/

World.addModule('PlethoraOriginal',
{
	load : function()
	{
		// Load tiles and graphics
		var plethora_original = World.addTileset('tileset.png');
		World.addSimpleClass('duck', {
			tileset: plethora_original,
			tiles : [5,1],
			shape: World.CYLINDER,
			radius: 0.3,
			height: [0,1]
		});
		World.addSimpleClass('dudetop', {
			tileset: plethora_original,
			flags: World.DIRECTED | World.ANIMATED,
			tiles: [
				[[0,3],[1,3],[2,3],[3,3]], // north
				[[0,4],[1,4],[2,4],[3,4]], // east
				[[0,2],[1,2],[2,2],[3,2]], // south
				[[0,5],[1,5],[2,5],[3,5]] // west
			],
			shape: World.CYLINDER,
			radius : 0.4,
			height: [0,1] 
		});
		World.addSimpleClass('dudebottom', {
			tileset: plethora_original,
			flags: World.DIRECTED | World.ANIMATED,
			tiles: [
				[[4,3],[5,3],[6,3],[7,3]],
				[[4,4],[5,4],[6,4],[7,4]],
				[[4,2],[5,2],[6,2],[7,2]],
				[[4,5],[5,5],[6,5],[7,5]]
			],
			shape: World.CYLINDER,
			radius: 0.4,
			height: [0,1]
		});
/*		World.addComplexClass('dude',{
			create: function(x,y,z,params){
				if(params == undefined)params = {};
				if(params.allowjump == undefined)params.allowjump=true;
				
				var plr = World.createObject('dudebottom', x, y, z,   {fixed: false});
				plr.head = World.createObject('dudetop',   x, y, z+1, {fixed: false});
				plr.walkx = plr.walky = 0;

				plr.frameMaxTicks=0;
				plr.head.frameMaxTicks=0;

				World.linkObjects(plr, plr.head);

				World.setCameraFocus(plr);
		
				plr.allowjump = allowjump;
				plr.collision_listener = function(self, other, nx, ny, nz, displacement){
					if(nz>0.5)
					{
						return {
							vx: -self.walkx,
							vy: -self.walky,
							vz: 0
						};
					}
					return true;
				};
			},
			step: function(){
				var plr = this;
				var head = this.head;
				var d = 0.15;
	
				var movement_x = 0;
				var movement_y = 0;
	
				if(Key.get(KEY_LEFT)){ 
					movement_x -= 1;
				}
				if(Key.get(KEY_RIGHT)){ 
					movement_x += 1;
				}
				if(Key.get(KEY_UP)){
					movement_y -= 1;
				}
				if(Key.get(KEY_DOWN)){ 
					movement_y += 1;
				}

				// Inhibit diagonal movement
				var dd = Math.sqrt(movement_x*movement_x+movement_y*movement_y);
				if(dd>0)
				{
					movement_x *= d/dd;
					movement_y *= d/dd;
				}

				plr.walkx = movement_x - plr.vx/20;
				plr.walky = movement_y - plr.vy/20;

				if(Key.get(KEY_LEFT))
				{
					plr.direction = WEST;
				}
				else if(Key.get(KEY_UP))
				{
					plr.direction = NORTH;
				}
				else if(Key.get(KEY_RIGHT))
				{
					plr.direction = EAST;
				}
				else if(Key.get(KEY_DOWN))
				{
					plr.direction = SOUTH;
				}
	
				var speed = (plr.vx*plr.vx+plr.vy*plr.vy);
				var maxticks = (speed<0.001) ? 0 : 0.10/speed;
				plr.frameMaxTicks = maxticks;
				plr.head.frameMaxTicks = maxticks;
	
				if(plr.allowjump == true && Key.changed(KEY_SPACE) && Key.get(KEY_SPACE))
				{
					var f = 0.25;
					plr.fz += f;
					plr.head.fz += f;
				}
	
				// Synch head movement to body movement
				plr.head.direction = plr.direction;
			}
		});*/
		World.addSimpleClass('hillrugged', {
			tileset: plethora_original,
			flags: World.DIRECTED, 
			tiles: [[0,8],[0,10],[0,9],[1,8]]
		});
		World.addSimpleClass('hillplain', {
			tileset: plethora_original,
			flags: World.DIRECTED, 
			tiles: [[4,8],[4,10],[4,9],[5,8]]
		});
		World.addSimpleClass('groundrugged', {
			tileset: plethora_original,
			tiles: [1,9]
		});
		World.addSimpleClass('groundplain', {
			tileset: plethora_original,
			tiles: [5,9]
		});
		World.addSimpleClass('groundblock', {
			tileset: plethora_original,
			tiles: [3,9]
		});
		World.addSimpleClass('lift_simple', {
			tileset: plethora_original,
			flags: World.ANIMATED,
			tiles: [[0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6]]
		});
		/*World.addComplexClass('lift', {
			create : function(x,y,z, options)
			{
				if(options == undefined)options = {};
				if(options.fixed == undefined)options.fixed = true;
				var obj = World.createObject('lift_simple', x, y, z, options.fixed);
				obj.frameMaxTicks = 0; // Disable automatic animation
		
				obj.mode = 'automatic'; // Nox-style
				obj.state = 'waiting';
				obj.waitTicks = 0;
				obj.waitMaxTicks = 25;
				obj.animMaxTicks = 3; // ticks per frame
				this.lift = obj;
			},
			step : function()
			{
				// Step any existing lifts...
				var lift = this.lift;
				if(lift.state == 'waiting')
				{
					lift.waitTicks++;
					if(lift.waitTicks >= lift.waitMaxTicks)
					{
						lift.waitTicks = 0;
						if(lift.frame == 0)
							lift.state = 'ascending';
						else
							lift.state = 'descending';
					}
				}
				else if(lift.state == 'ascending' || lift.state == 'descending')
				{
					lift.waitTicks++;
				
					if(lift.waitTicks >= lift.animMaxTicks)
					{
						lift.waitTicks = 0;
					
						if(lift.state == 'ascending')
							lift.frame++;
						else
							lift.frame--;
				
						if(lift.frame>=9 || lift.frame <= 0)
						{
							if(lift.mode=='automatic')
								lift.state = 'waiting';
							else
								lift.state = 'standby';
						}
					}
				}
				lift.tiles.c.h = lift.frame/9;
			}
		});*/
		World.addSimpleClass('water', {
			tileset: plethora_original,
			flags: World.ANIMATED_RANDOM,
			tiles: [[2,0],[3,0]]
		});
		World.addSimpleClass('barrelwooden', {
			tileset: plethora_original,
			tiles: [2,1],
			shape: World.CYLINDER,
			radius: 0.40, 
			height: [0,1]
		});
		World.addSimpleClass('crate', {
			tileset: plethora_original,
			tiles: [3,1]
		});
		World.addSimpleClass('duck', {
			tileset: plethora_original,
			tiles: [5,1],
			shape: World.CYLINDER,
			radius: 0.3,
			height: [0,1]
		});
		World.addSimpleClass('famouscube', {
			tileset: plethora_original,
			tiles: [4,1]
		});
		World.addSimpleClass('shadow', {
			tileset: plethora_original,
			tiles: [8,1],
			shape: World.CYLINDER, 
			radius: 0.5, 
			height: 1
		});
		World.addSimpleClass('darkblock', {
			tileset: plethora_original,
			tiles: [0,11], 
			shape: World.BOX, 
			bbox: [[0,0,0],[1,1,0.5]]
		});
		World.addSimpleClass('fencex', {
			tileset: plethora_original,
			tiles:[4,0], 
			shape: World.BOX, 
			bbox: [[0,0.3,0],[1,0.7,1]]
		});
		World.addSimpleClass('fencey', {
			tileset: plethora_original,
			tiles:[5,0], 
			shape: World.BOX,
			bbox: [[0.3,0,0],[0.7,1,1]]
		});
		World.addSimpleClass('beltx', {
			tileset: plethora_original,
			flags: World.ANIMATED, 
			tiles: [[10,0],[11,0],[12,0],[13,0],[14,0]], 
			shape: World.BOX,
			bbox: [[0,0,0],[1,1,0.5]]
		});
		World.addSimpleClass('belty', {
			tileset: plethora_original,
			flags: World.ANIMATED, 
			tiles: [[10,1],[11,1],[12,1],[13,1],[14,1]], 
			shape: World.BOX, 
			bbox: [[0,0,0],[1,1,0.5]]
		});
		World.addSimpleClass('famouslogo', {
			tileset: plethora_original,
			tiles: [9,1]
		});
		World.addSimpleClass('redblock', {
			tileset: plethora_original,
			flags: World.ANIMATED, 
			tiles: [[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2]]
		});
		World.addSimpleClass('slopesouth', {
			tileset: plethora_original,
			tiles: [4, 8 ], 
			shape: World.HEIGHTMAP, 
			corners: [1,1,0,0]
		});
		World.addSimpleClass('slopeeast',  {
			tileset: plethora_original,
			tiles: [5, 8 ], 
			shape: World.HEIGHTMAP, 
			corners: [1,0,0,1]
		});
		World.addSimpleClass('slopenorth', {
			tileset: plethora_original,
			tiles: [4, 9 ], 
			shape: World.HEIGHTMAP, 
			corners: [0,0,1,1]
		});
		World.addSimpleClass('slopewest',  {
			tileset: plethora_original,
			tiles: [4, 10], 
			shape: World.HEIGHTMAP, 
			corners: [0,1,1,0]
		});
	}
});
/*	createLift : function(x, y, z, fixed)
	{
		
	},
	createConveyorBeltX : function(x, y, z, direction, fixed)
	{
		if(direction == undefined)direction = 1;
		var obj = World.createObject(Graphics.ConveyorBeltX, x, y, z, fixed);
		obj.frameMaxTicks = 1 * direction;
		obj.direction = direction;
		obj.collision_listener = function(self, other, nx, ny, nz, displacement)
		{
			if(Math.abs(nz+1) > 0.01)return true;
			var force = 0.05*self.direction;
			return {
				vx: force, 
				vy: 0, 
				vz: 0
			};
		}
		return obj;
	},
	createConveyorBeltY : function(x, y, z, direction, fixed)
	{
		if(direction == undefined)direction = 1;
		var obj = World.createObject(Graphics.ConveyorBeltY, x, y, z, fixed);
		obj.frameMaxTicks = 1 * direction;
		obj.direction = direction;
		obj.collision_listener = function(self, other, nx, ny, nz, displacement)
		{
			if(Math.abs(nz+1) > 0.01)return true;
			var force = 0.05*self.direction;
			return {
				vx: 0, 
				vy: force, 
				vz: 0
			};
		}
		return obj;
	},
	createAnimator : function(obj, params)
	{
		if(params.type == 'transfer')
		{
			obj.hasGravity = false; // animated objects needn't no gravity
			obj.fixedCollide = false; // animated objects needn't collide with fixed objects
			var anim = {
				obj : obj,
				link : World.linkObjects(obj, null),
				current_frame : 0,
				target_frame : params.time * Config.FPS,
				state: 0, // 0 = moving forward, 1 = waiting, 2 = moving backward, 3 = waiting
				srcX: obj.x,
				srcY: obj.y,
				srcZ: obj.z,
				destX: params.target[0],
				destY: params.target[1],
				destZ: params.target[2],
				movetime: params.time,
				sleeptime: params.sleep,
				step: function()
				{
					var d = 0;
					if(this.state == 0)
						d = this.current_frame / this.target_frame;
					else if(this.state == 1)
						d = 1;
					else if(this.state == 2)
						d = 1.0-this.current_frame / this.target_frame;
					else if(this.state == 3)
						d = 0;

					this.link.dx = this.srcX + (this.destX-this.srcX) * d;
					this.link.dy = this.srcY + (this.destY-this.srcY) * d;
					this.link.dz = this.srcZ + (this.destZ-this.srcZ) * d;

					if(++this.current_frame >= this.target_frame)
					{
						this.current_frame = 0;
						if(++this.state>3)this.state=0;
						if(this.state==0 || this.state==2)
							this.target_frame = this.movetime * Config.FPS;
						else
							this.target_frame = this.sleeptime * Config.FPS;
						
					}
				}
			};
			Base.animators.push(anim);
			return anim;
		}
		else
		{
			throw 'unknown animator type';
		}
	},
	step : function()
	{
		

		// Step animators
		for(var i = 0; i < Base.animators.length; i++)
		{
			Base.animators[i].step();
		}
	}

};

);*/
