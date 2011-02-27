
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

// Create escalator with animators
function createEscalatorX(x,y,z,levels,stepsize,usebelts)
{
for(var i = 0; i < levels; i++)
{
for(var a=0;a<stepsize;a++)
{
	var b;
	if(usebelts==true)
	{
		b = Base.createConveyorBeltX(x+i*stepsize+a,y,z+i-i%2, 1, i%2==0);
	}
	else
	{
		b = World.createObject(Graphics.DarkBlock, x+i*stepsize+a,y,z+i-i%2,i%2==0);
	}
	if(i%2!=0)
	{
		var anim = Base.createAnimator(b, {
			type : 'transfer',
			target: [x+i*stepsize+a,y,z+i+1],
			time : 1,
			sleep: 1.5
		});
		anim.link.maxforce = 0.5;
	}
	if(a==0)
	{
	var below1 = World.createObject(Graphics.GroundRugged, x+i*stepsize+a, y, z+i-i%2-1, i%2==0);
	var below2 = World.createObject(Graphics.GroundRugged, x+i*stepsize+a, y, z+i-i%2-2, i%2==0);
	if(i%2!=0)
	{
		World.linkObjects(b,below1);
		World.linkObjects(below1,below2);
		below1.hasGravity = false;
		below2.hasGravity = false;
		below1.fixedCollide = false;
		below2.fixedCollide = false;
	}
	}
}
}
}


// long conveyor bridge
for(var i = 0; i < 20; i++)
{
	var h = 0; // we will rise in height 0.5
	h = 0.5*i/10;
	if(h>0.5)h=0.5;

	if(i<19)
	{
		Base.createConveyorBeltY(20,i,0.5+h);
		if(i>5)
			Base.createConveyorBeltY(21,i,0.5+h);
		else
			Base.createConveyorBeltX(21,i,0.5+h, -1);
		if(i>5)
			Base.createConveyorBeltY(19,i,0.5+h);
		else
			Base.createConveyorBeltX(19,i,0.5+h);
	}
	else if(i==19)
	{
		for(var a=0;a<3;a++)
			Base.createConveyorBeltX(19+a,i,0.5+h, -1);
	}
	World.createObject(Graphics.FenceY, 22,i,1);
}

Base.createGuy(0,0,1, false); // no jumping
//Base.createGuy(20,20,5, false); // no jumping
//Base.createGuy(86,5,15, false); // no jumping
Base.createLift(15,0,0);
World.createObject(Graphics.GroundRugged, 14,0,2);

// part 2
// four companion cubes will be required here

// the big wall
World.createObject(Graphics.RedBlock, 17,24,2);
for(var i = 0; i < 10; i++)
{
	for(var z = 0; z < 6; z++)
	{
		if(i != 4 || z > 4 || z < 2)
			World.createObject(Graphics.GroundRugged, 18-((z>2&&(i<5||z>=4))?1:0), 20+i, z-2);
		World.createObject(Graphics.GroundRugged, 18-((z>2&&i>7)?1:0), 10+i, z-2);
	}
	for(var y = -1; y < 20; y++)
	{
		if(y==0&&i==0)continue;
		World.createObject(Graphics.DarkBlock, 20+y, 20+i, -2);
	}
}
// ridge
for(var i=0;i<6;i++)
	Base.createConveyorBeltY(18,18+i,1);
Base.createConveyorBeltX(18,24,0.5,-1);
World.createObject(Graphics.DarkBlock,18,24,0,-1);
World.createObject(Graphics.DarkBlock,18,24,0,-1);



// tunneling..
World.createObject(Graphics.GroundRugged, 19, 19, -1);
World.createObject(Graphics.GroundRugged, 19, 19, -2);
World.createObject(Graphics.GroundRugged, 21, 19, -1);
World.createObject(Graphics.GroundRugged, 21, 19, -2);
World.createObject(Graphics.GroundRugged, 19, 19, 0);
World.createObject(Graphics.GroundRugged, 20, 19, 0);
World.createObject(Graphics.GroundRugged, 21, 19, 0);
World.createObject(Graphics.GroundRugged, 21, 19, 0);
World.createObject(Graphics.GroundRugged, 21, 18, 0);
World.createObject(Graphics.GroundRugged, 21, 17, 0);
World.createObject(Graphics.GroundRugged, 21, 17, -1);
World.createObject(Graphics.GroundRugged, 21, 17, -2);
World.createObject(Graphics.GroundRugged, 20, 17, -2);
World.createObject(Graphics.GroundRugged, 20, 17, -1);

Base.createConveyorBeltY(20,20,-2,-1);
Base.createConveyorBeltY(20,19,-2,-1);

for(var i = 0; i < 20; i++)
{
	if(i<12)
		Base.createConveyorBeltX(20+i,18,-2);
	else
		World.createObject(Graphics.DarkBlock,20+i,18,-2);
	if(i>1)
	{
		World.createObject(Graphics.DarkBlock,20+i,19,-2);
		if(i!=16)
		{
			World.createObject(Graphics.FenceX,20+i,19,-1.5);
		}
		if(i<10)
		{
			World.createObject(Graphics.DarkBlock,20+i,17,-2);
			World.createObject(Graphics.FenceX,20+i,17,-1.5);
		}
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
	World.createObject(Graphics.GroundRugged,30+x,17,-2+z+0.5);
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
	[4,0,0]
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
World.createObject(Graphics.Crate,57,6,1, false);

createEscalatorX(56,6,-2, 15, 2, false);

// 3rd area
for(var x=0;x<10;x++)
for(var y=0;y<10;y++)
{
	if(x==6&&(y==3||y==6))
	{
		var o = World.createObject(Graphics.RedBlock, 86+x, 0+y, 11.5, false);
		World.linkObjects(o,null,0);
		o.hasGravity = false;
		o.mass = 10;
	}
	else
		World.createObject(Graphics.DarkBlock, 86+x, 0+y, 12);
}
// block other pipe
World.createObject(Graphics.GroundPlain, 92, 3, 10.2);

// winners' platform.
World.createObject(Graphics.GroundPlain, 92, 7, -10);
World.createObject(Graphics.N64, 92, 7, -9, false);

function level_loop()
{
	Base.step();
}

initialize()
