
var Game = {
	player: {}
};


for(var x = 0; x < 10; x++)
for(var y = 0; y < 10; y++)
{
	var d = ((x-4.5)*(x-4.5)+(y-4.5)*(y-4.5));

	var obj = World.createObject(
		(d > 4*4)?Graphics.Water:Graphics.GroundRugged, [x, y, 0]);
	obj.frameMaxTicks = 5;

	if(d < 2*2)
	{
		//World.createObject(Graphics.GroundRugged, [x, y, 1]);
	}
}

for(var i = 0; i < 10; i++)
{
	World.createObject(Graphics.BarrelWooden, [5, 5, 1+i], false);
	World.createObject(Graphics.BarrelWooden, [6, 5, 1+i], false);
}

Game.player = World.createObject(Graphics.DudeBottom, [6,6,1], false);
Game.player.head = World.createObject(Graphics.DudeTop, [6,6,2], false);

Game.player.frameMaxTicks=5;
Game.player.head.frameMaxTicks=5;

World.linkObjects(Game.player, Game.player.head);

World.setCameraFocus(Game.player);

var prev = null;
for(var i = 0; i < 11; i++)
{
	var obj = World.createObject(Graphics.Crate, [i, 10, 0], prev==null);
	if(prev != null)
		World.linkObjects(obj, prev);
	prev = obj;
}
for(var i = 0; i < 50; i++)
{
	var obj = World.createObject(Graphics.Crate, [10, 9-i, 0], false);
	World.linkObjects(obj, prev);
	prev = obj;
}
for(var x = 0; x < 5; x++)
for(var y = 0; y < 5; y++)
{
	var obj = World.createObject(Graphics.GroundRugged, [11+x, -36-y, 0], false);
	World.linkObjects(obj, prev);
	prev = obj;
}

World.createObject(Graphics.Duck, [13,-38,1], false);

// This function gets called each frame
function level_loop()
{
	// Keyboard controlled object gets some force
	var obj = Game.player;
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

	obj.force[0] += movement[0] - obj.vel[0]/20;
	obj.force[1] += movement[1] - obj.vel[1]/20;

	if(Key.get(KEY_LEFT) && Key.get(KEY_UP))
		obj.direction = WEST;
	else if(Key.get(KEY_UP) && Key.get(KEY_RIGHT))
		obj.direction = NORTH;
	else if(Key.get(KEY_RIGHT) && Key.get(KEY_DOWN))
		obj.direction = EAST;
	else if(Key.get(KEY_DOWN) && Key.get(KEY_LEFT))
		obj.direction = SOUTH;
		
	if(Key.changed(KEY_SPACE) && Key.get(KEY_SPACE)){
	  Game.player.force[2] += 5;
	  Game.player.head.force[2] += 5;
	}
	
	// Synch head movement to body movement
	Game.player.head.direction = Game.player.direction;
}

initialize();
