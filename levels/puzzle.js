
for(var i = 0; i < 19; i++)
{
	if(i>15||i<13)
	{
		World.createObject(Graphics.GroundRugged, [i,0,0]);
		World.createObject(Graphics.GroundRugged, [i,0,-1]);
	}
	else if(i<15)
	{
		Base.createConveyorBeltX([i,0,-0.5]);
	}
	if(i<4)World.createObject(Graphics.CompanionCube, [i+1,0,1], false);
}
for(var i = 0; i < 20; i++)
{
	//World.createObject(Graphics.DarkBlock, [21,i,1]);
	Base.createConveyorBeltY([20,i,0.5]);
	Base.createConveyorBeltX([19,i,0.5]);
	Base.createConveyorBeltX([21,i,0.5], -1);
}

Base.createGuy([0,0,1], false); // no jumping
Base.createLift([15,0,0]);
World.createObject(Graphics.GroundRugged, [14,0,2]);

for(var i = 0; i < 5; i++)
	World.createObject(Graphics.CompanionCube, [20,0,2+i], false);
//World.createObject(Graphics.GroundRugged, [20,1,2]);


function level_loop()
{
	Base.step();
}

initialize();
