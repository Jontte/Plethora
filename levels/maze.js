
var Game = {
	player: {}
};


for(var x = 0; x < 20; x++)
for(var y = 0; y < 20; y++)
{
	var d = (x*x+y*y);

	var obj = World.createObject(
		(d < 6*6)?Graphics.Water:Graphics.GroundRugged, [x, y, 0]);
	obj.frameMaxTicks = 5;

	if(d < 2*2)
	{
		World.createObject(Graphics.GroundRugged, [x, y, 1]);
	}
}

for(var i = 0; i < 10; i++)
{
	World.createObject(Graphics.BarrelWooden, [5, 5, 1+i]).static = false;
	World.createObject(Graphics.BarrelWooden, [6, 5, 1+i]).static = false;
}

Game.player = World.createObject(Graphics.DudeBottom, [6,6,1]);
Game.player.head = World.createObject(Graphics.DudeTop, [6,6,2]);

Game.player.static = false;
Game.player.head.static = false;

Game.player.frameMaxTicks=5;
Game.player.head.frameMaxTicks=5;

World.linkObjects(Game.player, Game.player.head);

World.setKeyboardControl(Game.player);
World.setCameraFocus(Game.player);

function level_loop()
{
	// Synch head movement to body movement
	Game.player.head.direction = Game.player.direction;
}


// Finished loading level.
initialize();

