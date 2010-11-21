
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

World.setKeyboardControl(Game.player);
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
var foo = prev;
for(var x = 0; x < 5; x++)
for(var y = 0; y < 5; y++)
{
	var obj = World.createObject(Graphics.GroundRugged, [11+x, -36-y, 0], false);
	World.linkObjects(obj, prev);
	prev = obj;
	if(x==4&&y==4)
	  World.linkObjects(obj,foo);
}

World.createObject(Graphics.Duck, [13,-38,1], false);

function level_loop()
{
	// Synch head movement to body movement
	Game.player.head.direction = Game.player.direction;
}


// Finished loading level.
initialize();

