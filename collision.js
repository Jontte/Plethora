/*
	Collision detection functions
*/

function BoxBoxCollision(a,b)
{
	var dx = b.x-a.x;
	var dy = b.y-a.y;
	var dz = b.z-a.z;
	
	var tx = (a.bx+b.bx)/2;
	var ty = (a.by+b.by)/2;
	var tz = (a.bz+b.bz)/2;
	
	// Try each axis
	var d = 0;

	if(Math.abs(dx)<tx&& Math.abs(dy)<ty&&Math.abs(dz)<tz)
	{
		var ret = [];
		return [
			new World.Collision(-sign(dx),0,0, tx-Math.abs(dx)),
			new World.Collision(0,-sign(dy),0, ty-Math.abs(dy)),
			new World.Collision(0,0,-sign(dz), tz-Math.abs(dz))
		];
	}
	return [];
}
function BoxCylinderCollision(box,cyl)
{
	var ret = [];

	var dx = cyl.x-box.x;
	var dy = cyl.y-box.y;
	var dz = cyl.z-box.z;
	
	var tx = (cyl.bx+box.bx)/2;
	var ty = (cyl.by+box.by)/2;
	var tz = (cyl.bz+box.bz)/2;
	
	// Hit top/bottom?
	if(Math.abs(dz)>tz)
		return [];

	ret.push(
		new World.Collision(0,0,-sign(dz), tz-Math.abs(dz))
	);

	var hit = false;

	// Hit sides?
	if(Math.abs(dy) < box.by/2 && Math.abs(dx) <= tx)
	{
		ret.push(new World.Collision(-sign(dx),0,0,tx-Math.abs(dx)));
		hit = true;
	}
	if(Math.abs(dx) < box.bx/2 && Math.abs(dy) <= ty)
	{
		ret.push(new World.Collision(0,-sign(dy),0,ty-Math.abs(dy)));
		hit = true;
	}
	if(hit)
		return ret;

	// Hit corners?
	var xx,yy,d,s;

	for(var i = 0; i < 4; i++)
	{
		s = [i%2?1:-1, i/2?1:-1];
		xx = (dx+s[0]*box.bx/2)/(cyl.bx/2);
		yy = (dy+s[1]*box.by/2)/(cyl.by/2);
		d = xx*xx+yy*yy;
	
		if(d < 1) {
			ret.push(new World.Collision(-xx,-yy,0,1-d));
			hit = true;
		}
	}

	if(hit)
		return ret;
	return [];
}
function BoxSlopeCollision(box, slope)
{
	return [];
}
function CylinderCylinderCollision(cyl1, cyl2)
{
	var ret = [];

	var dx = cyl2.x-cyl1.x;
	var dy = cyl2.y-cyl1.y;
	var dz = cyl2.z-cyl1.z;
	
	var tx = (cyl2.bx+cyl1.bx)/2;
	var ty = (cyl2.by+cyl1.by)/2;
	var tz = (cyl2.bz+cyl1.bz)/2;
	
	// Hit top/bottom?
	if(Math.abs(dz)>tz)
		return [];

	ret.push(
		new World.Collision(0,0,-sign(dz), tz-Math.abs(dz))
	);
	
	var xx,yy,d;
	xx = (dx)/(tx);
	yy = (dy)/(ty);
	d = xx*xx+yy*yy;
	
	if(d < 1)
	{
		ret.push(new World.Collision(-xx,-yy,0,1-d));
		return ret;
	}

	return [];
}
function CylinderSlopeCollision(cyl, slope)
{
	return [];
}
function SlopeSlopeCollision(slope1, slope2)
{
	return [];
}

World._registerCollider(	World.BOX,			World.BOX,			BoxBoxCollision				);
World._registerCollider(	World.BOX,			World.CYLINDER,		BoxCylinderCollision		);
World._registerCollider(	World.BOX,			World.SLOPE,	 	BoxSlopeCollision			);
World._registerCollider(	World.CYLINDER,		World.CYLINDER,		CylinderCylinderCollision	);
World._registerCollider(	World.CYLINDER,		World.SLOPE,		CylinderSlopeCollision		);
World._registerCollider(	World.SLOPE,		World.SLOPE,		SlopeSlopeCollision			);

	/*_collide : function(o1, o2)
	{
		// Quick bounding volume checks to rule obvious cases out:
		if(o1.z+o1.tiles.c.h < o2.z)
			return false;
		if(o1.z > o2.z+o2.tiles.c.h)
			return false;
		if(o1.x+1.1 < o2.x) return false;
		if(o1.x-1.1 > o2.x) return false;
		if(o1.y+1.1 < o2.y) return false;
		if(o1.y-1.1 > o2.y) return false;

		// Distance to move the objects on top of eachother 
		var topdown_distance = Math.min(
			 Math.abs((o1.z+o1.tiles.c.h)-o2.z),
			 Math.abs(o1.z-(o2.z+o2.tiles.c.h))
		);
		// determine which of the objs is on top..
		var topdown_normal = ((o1.z+o1.tiles.c.h/2) > (o2.z+o2.tiles.c.h/2))?1:-1;

		var collided = false;
		var ret = {
			nx: 0,
			ny: 0,
			nz: topdown_normal, 
			displacement: topdown_distance
		};

		// Function used to update the best candidate normal and displacement
		// Note, ret is only returned when collision is verified (collided=true)
		function apply(current, candidate)
		{
			if(candidate.displacement < current.displacement)
			{
				// Enable stepping. This two-line addition disables fine xy-plane collisions
				// If we only have to jump less than 0.2 units to satisfy vertical collision
				if(current.nz>0.99 && current.displacement < 0.2)
					return;
				current.nx = candidate.nx;
				current.ny = candidate.ny;
				current.nz = candidate.nz;
				current.displacement = candidate.displacement;
			}
		}

		// XY-check:
		if(o1.tiles.c.s == 'cylinder' && o2.tiles.c.s == 'cylinder')
		{
			var d = 
				Math.sqrt(
				 (o1.x-o2.x)*(o1.x-o2.x)+
				 (o1.y-o2.y)*(o1.y-o2.y)
				);
			if(d < (o1.tiles.c.r + o2.tiles.c.r))
			{
				// calculate normal + normalize it
				var nx = o1.x-o2.x;
				var ny = o1.y-o2.y;
				var nz = 0;
				var len = Math.sqrt(nx*nx+ny*ny+nz*nz);
				nx /= len;
				ny /= len;
				nz /= len;
				apply(ret, {nx: nx, ny: ny, nz: nz, 
					displacement: o1.tiles.c.r+o2.tiles.c.r-d});
				collided = true;
			}
		}
		else if((o1.tiles.c.s == 'cylinder' && o2.tiles.c.s == 'box')
		|| (o1.tiles.c.s == 'box' && o2.tiles.c.s == 'cylinder'))
		{
			var box = (o1.tiles.c.s=='cylinder')?o2:o1;
			var cyl = (o1.tiles.c.s=='cylinder')?o1:o2;

			var dx = box.x-cyl.x;
			var dy = box.y-cyl.y;
			var dist = box.tiles.c.l/2 + cyl.tiles.c.r;

			// check sides
			if((Math.abs(dx) < dist) && Math.abs(dy) < box.tiles.c.l/2)
			{
				apply(ret, {nx: (o1.x>o2.x)?1:-1, ny: 0, nz: 0, displacement: dist-Math.abs(dx)});
				collided = true;
			}
			else if((Math.abs(dy) < dist) && Math.abs(dx) < box.tiles.c.l/2)
			{
				apply(ret, { nx: 0, ny: (o1.y>o2.y)?1:-1, nz: 0, displacement: dist-Math.abs(dy)});
				collided = true;
			}
			else
			{
				var d = 0;
	
				// check corners
				var corners = [[1,1],[-1,1],[1,-1],[-1,-1]];
				for(var i = 0; i < 4; i++)
				{
					var xmul = corners[i][0];
					var ymul = corners[i][1];
					
					var corner = [
						box.x + xmul*box.tiles.c.l/2,
						box.y + ymul*box.tiles.c.l/2
					];
					
					dx = corner[0] - cyl.x;
					dy = corner[1] - cyl.y;
					
					dist = Math.sqrt(dx*dx+dy*dy);
					
					d = cyl.tiles.c.r - dist;
					
					if(d > 0)
					{
					 	var mul = (o1.id == box.id)?1:-1;
						apply(ret, {nx: mul*dx/dist, ny: mul*dy/dist, nz: 0, displacement: d});
						collided = true;
					}
				}
			}
		}
		else if(o1.tiles.c.s == 'box' && o2.tiles.c.s == 'box')
		{
			var dx = o2.x-o1.x;
			var dy = o2.y-o1.y;
			var length = o1.tiles.c.l/2+o2.tiles.c.l/2;
			
			if(Math.abs(dx) < length && Math.abs(dy) < length)
			{
				if(Math.abs(dx) > Math.abs(dy))
				{
					apply(ret, {nx: o1.x>o2.x?1:-1, ny: 0, nz: 0, displacement: length-Math.abs(dx)});
				}
				else
				{
					apply(ret, {nx: 0, ny: o1.y>o2.y?1:-1, nz: 0, displacement: length-Math.abs(dy)});
				}
				collided = true;
			}
		}
		else {
			console.log('Unhandled collision for: ' + o1.tiles.c.s + ' vs ' + o2.tiles.c.s);
		}
		if(collided)
			return ret;
		return false;
}*/
