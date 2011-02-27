
for(var i = 0; i < 19; i++)
{
	if(i>15||i<13)
	{
		World.createObject(Graphics.GroundRugged, i,0,0);
		World.createObject(Graphics.GroundRugged, i,0,-1);
	}
	else if(i<15)
	{
		Base.createConveyorBeltX(i,0,-0.5);
	}
	if(i<4)World.createObject(Graphics.CompanionCube, i+1,0,1, false);
}
for(var i = 0; i < 20; i++)
{
	//World.createObject(Graphics.DarkBlock, [21,i,1]);
	Base.createConveyorBeltY(20,i,0.5);
	Base.createConveyorBeltX(19,i,0.5);
	Base.createConveyorBeltX(21,i,0.5, -1);
	World.createObject(Graphics.FenceY, 22,i,0.5);
}

Base.createGuy(0,0,1, false); // no jumping
Base.createLift(15,0,0);
World.createObject(Graphics.GroundRugged, 14,0,2);

// part 2
// four companion cubes will be required here

for(var i = 0; i < 10; i++)
{
	for(var z = 0; z < 6; z++)
	{
		World.createObject(Graphics.GroundRugged, 18, 20+i, z-2);
		World.createObject(Graphics.GroundRugged, 18, 10+i, z-2);
	}
	for(var y = -1; y < 20; y++)
	{
		if(y==0&&i==0)continue;
		World.createObject(Graphics.DarkBlock, 20+y, 20+i, -2);
	}
}
// tunneling..
World.createObject(Graphics.DarkBlock, 20, 19, 0);
World.createObject(Graphics.DarkBlock, 19, 19, 0);
World.createObject(Graphics.GroundRugged, 19, 19, -1);
World.createObject(Graphics.GroundRugged, 19, 19, -2);
World.createObject(Graphics.GroundRugged, 19, 18, -2);
Base.createConveyorBeltY(20,20,-2,-1);
Base.createConveyorBeltY(20,20, 0.5);
Base.createConveyorBeltY(20,21, 0.5);
Base.createConveyorBeltY(20,19,-2,-1);
Base.createConveyorBeltY(29,17,-2);
Base.createConveyorBeltX(20,17,-2);
Base.createConveyorBeltX(21,17,-2);
Base.createConveyorBeltY(22,17,-2);
for(var i = 0; i < 20; i++)
{
	if(i<12)
		Base.createConveyorBeltX(20+i,18,-2);
	else
		World.createObject(Graphics.DarkBlock,20+i,18,-2);
	if(i>0)
	{
		if(i!=16)
			World.createObject(Graphics.GroundRugged,20+i,19,-2);
		else
			World.createObject(Graphics.DarkBlock,20+i,19,-2);
	}
}
// back wall
for(var x=0;x<10;x++)
for(var z=0;z<4;z++)
{
	if(x==6&&z==0)
	{
		World.createObject(Graphics.DarkBlock,30+x,17,-2+z);
	}
	if(x==6&&z<3)continue;
	World.createObject(Graphics.GroundRugged,30+x,17,-2+z);
}
// create gate
var prev = null;
var pos = [
	[0,0,0],
	[0,0,1],
	[0,0,2],
	[0,0,3],
	[1,0,3],
	[2,0,3],
	[2,0,2],
	[2,0,1],
	[2,0,0],
	[3,0,0],
	[4,0,0],
	];
for(var i=0;i<pos.length;i++)
{
	var o = World.createObject(Graphics.Crate, 32+pos[i][0], 18+pos[i][1], -1.5+pos[i][2],false);
	if(prev != null)
		World.linkObjects(prev,o);
	prev = o;
}
// victory bridge
for(var i=0;i<10;i++)
{
	World.createObject(Graphics.DarkBlock,36,16-i,-2);
	World.createObject(Graphics.DarkBlock,36+i,6,-2);
	World.createObject(Graphics.DarkBlock,46+i,6,-2);
}
World.createObject(Graphics.Duck,55,6,1, false);

function level_loop()
{
	Base.step();
}

initialize()
