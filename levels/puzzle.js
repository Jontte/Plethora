
for(var i = 0; i < 20; i++)
{
	if(i>15||i<13)World.createObject(Graphics.GroundRugged, [i,0,0]);
	World.createObject(Graphics.GroundRugged, [i,0,-1]);
	if(i<4)World.createObject(Graphics.CompanionCube, [i+1,0,1], false);
}
for(var i = 0; i < 20; i++)
{
	World.createObject(Graphics.GroundRugged, [20,i+1,0]);
}

Base.createGuy([0,0,1], false); // no jumping
Base.createLift([15,0,0]);
World.createObject(Graphics.GroundRugged, [14,0,2]);

Base.createConveyorBeltY([20,0,0.5]);
World.createObject(Graphics.DarkBlock, [20,0,0]);

function level_loop()
{
	Base.step();
}

initialize();
