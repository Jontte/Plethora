
/*
	This file provides helper functions for creating a movable dude
*/

Base = 
{
	lifts: [],
	createGuy : function(position, allowjump)
	{
		if(allowjump == undefined)allowjump=true;
		
		var plr = World.createObject(Graphics.DudeBottom, position, false);
		plr.head = World.createObject(Graphics.DudeTop, [position[0],position[1],position[2]+1], false);

		plr.frameMaxTicks=5;
		plr.head.frameMaxTicks=5;

		World.linkObjects(plr, plr.head);

		World.setCameraFocus(plr);
		
		plr.allowjump = allowjump;
		Base.player = plr;
		
		return plr;
	},
	
	createLift : function(position, static)
	{
		var obj = World.createObject(Graphics.Lift, position, static);
		obj.frameMaxTicks = 0; // Disable automatic animation
		
		obj.mode = 'automatic'; // Nox-style
		obj.state = 'waiting';
		obj.waitTicks = 0;
		obj.waitMaxTicks = 25;
		obj.animMaxTicks = 3; // ticks per frame
		
		Base.lifts.push(obj);
		
		return obj;
	},
	createConveyorBeltX : function(position,direction,static)
	{
		if(direction == undefined)direction = 1;
		var obj = World.createObject(Graphics.ConveyorBeltX, position, static);
		obj.frameMaxTicks = 3 * direction;
		obj.direction = direction;
		obj.collision_listener = function(self, other, normal, displacement)
		{
			if(normal[2] != -1)return true;
			var area =
				 1.0 - ((other.pos[0]-self.pos[0])*(other.pos[0]-self.pos[0]) +
						(other.pos[1]-self.pos[1])*(other.pos[1]-self.pos[1]));
			var force = 0.1*self.direction - other.vel[0] + self.vel[0];
			return [force/10*area*other.mass, 0, 0];
		}
		return obj;
	},
	createConveyorBeltY : function(position,direction,static)
	{
		if(direction == undefined)direction = 1;
		var obj = World.createObject(Graphics.ConveyorBeltY, position, static);
		obj.frameMaxTicks = -3 * direction;
		obj.direction = direction;
		obj.collision_listener = function(self, other, normal, displacement)
		{
			if(normal[2] != -1)return true;
			var area =
				 1.0 - ((other.pos[0]-self.pos[0])*(other.pos[0]-self.pos[0]) +
						(other.pos[1]-self.pos[1])*(other.pos[1]-self.pos[1]));
			var force = 0.1*self.direction - other.vel[1] + self.vel[1];
			return [0, force/10*area*other.mass, 0];
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
			var d = 0.05;
	
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

			plr.force[0] += movement[0] - plr.vel[0]/20;
			plr.force[1] += movement[1] - plr.vel[1]/20;

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

			var speed = (plr.vel[0]*plr.vel[0]+plr.vel[1]*plr.vel[1]);
			var maxticks = (speed<0.001) ? 0 : 0.05/speed;
			plr.frameMaxTicks = maxticks;
			plr.head.frameMaxTicks = maxticks;

			if(plr.allowjump == true && Key.changed(KEY_SPACE) && Key.get(KEY_SPACE))
			{
				plr.force[2] += 1;
				plr.head.force[2] += 1;
			}
	
			// Synch head movement to body movement
			plr.head.direction = plr.direction;
		}
	}

};

