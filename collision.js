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
			new World.Collision(sign(dx),0,0, tx-Math.abs(dx)),
			new World.Collision(0,sign(dy),0, ty-Math.abs(dy)),
			new World.Collision(0,0,sign(dz), tz-Math.abs(dz))
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
	
	var z_hit = false;
	var xy_hit = false;
	
	// Try z-axis
	var d;
	
	d = dz-box.shape.bbox[1][2]+cyl.shape.height[0];
	if(d <= 0)
	{
		z_hit = true;
		ret.push(new World.Collision(0,0, 1,-d));
	}
	d = -dz+box.shape.bbox[0][2]-cyl.shape.height[1];
	if(d >= 0)
	{
		z_hit = true;
		ret.push(new World.Collision(0,0,-1, d));
	}
	if(!z_hit)
		return [];
	
	// Try sides X&Y

	if(	dx >= -0.5+box.shape.bbox[0][0] && 
		dx <= -0.5+box.shape.bbox[1][0])
	{
		d = dy-(cyl.shape.radius-(-0.5-box.shape.bbox[0][1]));
		if(d <= 0) {
			xy_hit = true;
			ret.push(new World.Collision(0, 1,0, -d));
		}
		d = dy-(cyl.shape.radius-(-0.5-box.shape.bbox[1][1]));
		if(d >= 0) {
			xy_hit = true;
			ret.push(new World.Collision(0, -1,0, d));
		}
	}
/*	if(	dy >= -0.5+box.tiles.c.bbox[0][1] && 
		dy <= -0.5+box.tiles.c.bbox[1][1])
	{
		d = dx+0.5-box.tiles.c.bbox[0][0] + cyl.tiles.c.r;
		if(d > 0) {
			xy_hit = true;
			ret.push(new World.Collision( 1,0,0, d));
		}
		d = -dx+0.5+box.tiles.c.bbox[1][0] - cyl.tiles.c.r;
		if(d < 0) {
			xy_hit = true;
			ret.push(new World.Collision(-1,0,0,-d));
		}
	}*/
	/*if(!xy_hit)
	{
		var corners = [
			[-0.5+box.tiles.c.bbox[0][0],-0.5+box.tiles.c.bbox[0][1]],
			[-0.5+box.tiles.c.bbox[0][0],-0.5+box.tiles.c.bbox[1][1]],
			[-0.5+box.tiles.c.bbox[1][0],-0.5+box.tiles.c.bbox[0][1]],
			[-0.5+box.tiles.c.bbox[1][0],-0.5+box.tiles.c.bbox[1][1]]
		];
		var rr = cyl.tiles.c.r * cyl.tiles.c.r;
		for(var i = 0; i < 4; i++)
		{
			dx = cyl.x-(box.x+corners[i][0]);
			dy = cyl.y-(box.y+corners[i][1]);
			d = dx*dx+dy*dy;
			if(d < rr && d > 0)
			{
				xy_hit = true;
				dx /= d;
				dy /= d;
				
				ret.push(new World.Collision(dx,dy,0,cyl.tiles.r-Math.sqrt(d)));
				
				break; 
				// not possible to have collisions with more than one corner
			}
		}
	}*/
	if(z_hit && xy_hit)
		return ret;
	return [];
}
function BoxHeightmapCollision(box, hmap)
{
	return [];
}
function CylinderCylinderCollision(cyl1, cyl2)
{
	var ret = [];

	var dx = cyl2.x-cyl1.x;
	var dy = cyl2.y-cyl1.y;
	var dz = cyl2.z-cyl1.z;
	
	// Try z-axis
	var d;
	var topdown = false; // z-axis hit was made
	
	d = dz-cyl1.shape.height[1]+cyl2.shape.height[0];
	if(d <= 0)
	{
		topdown = true;
		ret.push(new World.Collision(0,0, 1,-d));
	}
	d = -dz+cyl1.shape.height[0]-cyl2.shape.height[1];
	if(d >= 0)
	{
		topdown = true;
		ret.push(new World.Collision(0,0,-1, d));
	}
	if(!topdown)
		return ret;
	
	var mindist = cyl1.shape.radius + cyl2.shape.radius;
	
	dist = dx*dx+dy*dy;
	d = dist-mindist*mindist;
	if(d <= 0)
	{
		dist = Math.sqrt(dist);
		var xx = dx/dist;
		var yy = dy/dist;
		ret.push(new World.Collision(xx,yy,mindist-dist));
	}
	return ret;
}
function CylinderHeightmapCollision(cyl, hmap)
{
	return [];
}
function HeightmapHeightmapCollision(hmap1, hmap2)
{
	return [];
}

World._registerCollider(	World.BOX,			World.BOX,			BoxBoxCollision				);
World._registerCollider(	World.BOX,			World.CYLINDER,		BoxCylinderCollision		);
World._registerCollider(	World.BOX,			World.HEIGHTMAP, 	BoxHeightmapCollision		);
World._registerCollider(	World.CYLINDER,		World.CYLINDER,		CylinderCylinderCollision	);
World._registerCollider(	World.CYLINDER,		World.HEIGHTMAP,	CylinderHeightmapCollision	);
World._registerCollider(	World.HEIGHTMAP,	World.HEIGHTMAP,	HeightmapHeightmapCollision	);

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
