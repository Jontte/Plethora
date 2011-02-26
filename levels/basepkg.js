
/*
	This file provides helper functions for creating a movable dude
*/

Base = 
{
	lifts: [],
	createGuy : function(x, y, z, allowjump)
	{
		if(allowjump == undefined)allowjump=true;
		
		var plr = World.createObject(Graphics.DudeBottom, x, y, z, false);
		plr.head = World.createObject(Graphics.DudeTop, x, y, z+1, false);
		plr.walkx = plr.walky = 0;

		plr.frameMaxTicks=5;
		plr.head.frameMaxTicks=5;

		World.linkObjects(plr, plr.head);

		World.setCameraFocus(plr);
		
		plr.allowjump = allowjump;
		plr.collision_listener = function(self, other, nx, ny, nz, displacement){
			if(nz>0.5)
			{
				return {
					x: -self.walkx/5 + (self.vx-other.vx)/10,
					y: -self.walky/5 + (self.vy-other.vy)/10,
					z: 0
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
			var area =
				 1.0 - ((other.x-self.x)*(other.x-self.x) +
						(other.y-self.y)*(other.y-self.y));
			var force = 0.05*self.direction - other.vx + self.vx;
			return {
				x: force/10*area, 
				y: 0, 
				z: 0
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
			var area =
				 1.0 - ((other.x-self.x)*(other.x-self.x) +
						(other.y-self.y)*(other.y-self.y));
			var force = 0.05*self.direction - other.vy + self.vy;
			return {
				x: 0, 
				y: force/10*area, 
				z: 0
			};
		}
		return obj;
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
		
		
		// Step our dude
		if(Base.player)
		{
			var plr = Base.player;
			var head = Base.player.head;
			var d = 0.04;
	
			var movement = [0,0];
	
			if(Key.get(KEY_LEFT)){ 
				movement[0] -= d;
				movement[1] += d;
			}
			if(Key.get(KEY_RIGHT)){ 
				movement[0] += d;
				movement[1] -= d;
			}
			if(Key.get(KEY_UP)){
				movement[0] -= d;
				movement[1] -= d;
			}
			if(Key.get(KEY_DOWN)){ 
				movement[0] += d;
				movement[1] += d;
			}

			plr.walkx = movement[0] - plr.vx/20;
			plr.walky = movement[1] - plr.vy/20;

			if(Key.get(KEY_LEFT) && Key.get(KEY_UP))
			{
				plr.direction = WEST;
			}
			else if(Key.get(KEY_UP) && Key.get(KEY_RIGHT))
			{
				plr.direction = NORTH;
			}
			else if(Key.get(KEY_RIGHT) && Key.get(KEY_DOWN))
			{
				plr.direction = EAST;
			}
			else if(Key.get(KEY_DOWN) && Key.get(KEY_LEFT))
			{
				plr.direction = SOUTH;
			}

			var speed = (plr.vx*plr.vx+plr.vy*plr.vy);
			var maxticks = (speed<0.001) ? 0 : 0.05/speed;
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

