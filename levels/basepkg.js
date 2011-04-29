
/*
	This file provides helper functions for creating a movable dude
*/

Base = 
{
	lifts: [],
	animators: [],
	createGuy : function(x, y, z, allowjump)
	{
		if(allowjump == undefined)allowjump=true;
		
		var plr = World.createObject(Graphics.DudeBottom, x, y, z, false);
		plr.head = World.createObject(Graphics.DudeTop, x, y, z+1, false);
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
		
		
		Base.player = plr;
		return plr;
	},
	
	createLift : function(x, y, z, fixed)
	{
		var obj = World.createObject(Graphics.Lift, x, y, z, fixed);
		obj.frameMaxTicks = 0; // Disable automatic animation
		
		obj.mode = 'automatic'; // Nox-style
		obj.state = 'waiting';
		obj.waitTicks = 0;
		obj.waitMaxTicks = 25;
		obj.animMaxTicks = 3; // ticks per frame
		
		Base.lifts.push(obj);
		
		return obj;
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
		// Step any existing lifts...
		for(var i = 0; i < Base.lifts.length; i++)
		{
			var lift = Base.lifts[i];
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

		// Step animators
		for(var i = 0; i < Base.animators.length; i++)
		{
			Base.animators[i].step();
		}
		
		
		// Step our dude
		if(Base.player)
		{
			var plr = Base.player;
			var head = Base.player.head;
			var d = 0.15;
	
			var movement = [0,0];
	
			if(Key.get(KEY_LEFT)){ 
				movement[0] -= d;
			}
			if(Key.get(KEY_RIGHT)){ 
				movement[0] += d;
			}
			if(Key.get(KEY_UP)){
				movement[1] -= d;
			}
			if(Key.get(KEY_DOWN)){ 
				movement[1] += d;
			}

			plr.walkx = movement[0] - plr.vx/20;
			plr.walky = movement[1] - plr.vy/20;

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
	}

};

