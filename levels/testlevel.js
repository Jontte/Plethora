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

Base.createGuy([6,6,1]);

for(var i = 0; i < 5; i++)
	Base.createLift([2,8,1+i], false);

// This function gets called each frame
function level_loop()
{
	Base.step();
}

initialize();
