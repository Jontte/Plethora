
World.physicsStep = function()
{
//		console.time('physics');
		
	if(World._editor.online)
		return;

	for(var iter = 0; iter < World._physicsIterations; iter++)
	{
		// Sweep-line the objects
		//
		
		// Initialize proxy array
		for(var i = 0 ; i < World._proxy.length; i++)
		{
			var p = World._proxy[i];
			var o = p.obj;
			p.d = (o.x + o.y + o.z) + ((p.begin==true)?-1:1) * (o.bx+o.by+o.bz)/2;
		}

		// Sort it
		insertionSort(World._proxy, function(a,b){
			return a.d < b.d;
		});
		
		/* 
			This is the main body of the sweep & prune algorithm
			We also collide mobile objects to fixed objects inside this loop
		*/

		var objectbuffer = {};
		for(var i = 0; i < World._proxy.length; i++)
		{
			var p = World._proxy[i];
			if(p.begin == false)
			{
				// Remove object from buffer
				delete objectbuffer[p.obj.id];
			}
			else
			{
				var o1 = p.obj;
				for(var other in objectbuffer)
				{
					if(!objectbuffer.hasOwnProperty(other))continue;
					
					var o2 = objectbuffer[other].obj;

					// Collide with the other dynamic object
					World._tryCollideAndResponse(o1,o2);
				}
				// Add object to buffer 
				objectbuffer[p.obj.id] = p;
				
				// Should this object collide with fixed objects?
				if(o1.collideFixed)
				{
					// Look for nearby fixed objects, collide
					var result = World._tree.search({
						intervals:
						[
							{a: o1.x-o1.bx/2, b: o1.bx},
							{a: o1.y-o1.by/2, b: o1.by},
							{a: o1.z-o1.bz/2, b: o1.bz}
						]
					}); 
					for(var a = 0; a < result.length; a++)
					{
						World._tryCollideAndResponse(o1, result[a]);
					}
				}
			}
		}
		// process links
		for(var i = 0; i < World._links.length; i++)
		{
			var l = World._links[i];
			var o1 = l.o1;
			var o2 = l.o2;

			var errorx, errory, errorz;

			if(o2 != null)
			{
				errorx = l.dx-(o2.x-o1.x);
				errory = l.dy-(o2.y-o1.y);
				errorz = l.dz-(o2.z-o1.z);
			}
			else
			{
				errorx = -l.dx+o1.x;
				errory = -l.dy+o1.y;
				errorz = -l.dz+o1.z;
			}
			var d = 1.1; // tweakable multiplier

			if(l.maxforce >= 0)
			{
				var totalforce = errorx*errorx+errory*errory+errorz*errorz;
				if(totalforce*d*2 > l.maxforce)
				{
					// link force has exceeded maxforce. Drop it
					World._links.splice(i,1);
					i--;
					continue;
				}
			}

			if(o2 == null)d*=2;

			o1.fx -= errorx*d;
			o1.fy -= errory*d;
			o1.fz -= errorz*d;
			if(o2 != null)
			{
				o2.fx += errorx*d;
				o2.fy += errory*d;
				o2.fz += errorz*d;
			}
		}
		// Euler integrate (my friends hate me for this)
		for(var i = 0; i < World._mobile.length; i++)
		{
			var obj = World._mobile[i];
			obj.vx += obj.fx/obj.mass;
			obj.vy += obj.fy/obj.mass;
			obj.vz += obj.fz/obj.mass;
			obj.x += obj.vx/World._physicsIterations;
			obj.y += obj.vy/World._physicsIterations;
			obj.z += obj.vz/World._physicsIterations;
			
			// Mark moving objects dirty so that the render graph gets rebuilt for them
			if(	Math.abs(obj.vx)>0.001||
				Math.abs(obj.vy)>0.001||
				Math.abs(obj.vz)>0.001)
				obj.dirty = true;
			
			// Air friction..
			var af = 0.001;
				 if(obj.vx > af) obj.vx -= af;
			else if(obj.vx < -af)obj.vx += af;
			else obj.vx = 0;
				 if(obj.vy > af) obj.vy -= af;
			else if(obj.vy < -af)obj.vy += af;
			else obj.vy = 0;
				 if(obj.vz > af) obj.vz -= af;
			else if(obj.vz < -af)obj.vz += af;
			else obj.vz = 0;
		
			// reset forces & set gravity ready for next round

			obj.fx = 0;
			obj.fy = 0;
			obj.fz = (obj.hasGravity)?(-0.04*obj.mass/World._physicsIterations) : 0;
		}
	}
//		console.timeEnd('physics');
};

World._tryCollideAndResponse = function(o1, o2)
{
	var colldata = World._collide(o1, o2);
	if(colldata != false)
	{
		// It's a HIT! What to do now?
		var nx = colldata.nx;
		var ny = colldata.ny;
		var nz = colldata.nz;
		var displacement = colldata.displacement;
		
		// fx = final force to apply.
		var fx = 0;
		var fy = 0;
		var fz = 0;
		
		// Here's what we do:
		// 1. Call possible collision listeners and come to an agreement about the surface velocity, friction and restitution
		// 2. Project surface velocity vector [vx,vy,vz] to plane defined by surface normal [nx,ny,nz] and call it SV (surface velocity)
		// 3. Calculate current delta velocity between objects, project it to the same plane and subtract it from SV. Store in SV.
		// 4. Friction force = -SV/|SV|*friction multiplier. Add to [fx,fy,fz]
		// 5. Elastic/Inelastic collision based on restitution
		// 6. Apply fx to both bodies
		// 7. Rejoice
		
		// 1:
		// Alert possible collision listeners, that can either:
		// - cancel the collision
		// - set  surface velocity (conveyor belt, character movement)
		// - and/or set extra force for collision (character jumping)
		// - do nothing

		// vx,vy,vz = Target surface velocity
		// friction = How willingly we follow the target speed
		var vx = 0;
		var vy = 0;
		var vz = 0;
		var friction = 0.1; // max friction force
		var restitution = 1; // coefficient of restitution. unused for now..
		for(var i = 0; i < 2; i++)
		{
			var cur   = i==0?o1:o2;
			var other = i==0?o2:o1;
			if('collision_listener' in cur)
			{
				var mul = i==0?1:-1;
				var ret = cur.collision_listener(cur, other, nx*mul, ny*mul, nz*mul, displacement);
				if(ret === false)
				{
					// collision_listener wants to let the object pass thru
					return;
				}
				else if(typeof(ret) == 'object')
				{
					if('vx' in ret && 'vy' in ret && 'vz' in ret)
					{
						// Surface velocity was given
						vx += ret.vx * mul;
						vy += ret.vy * mul;
						vz += ret.vz * mul;
					}
					if('fx' in ret && 'fy' in ret && 'fz' in ret)
					{
						// Extra force was given
						fx += ret.fx * mul;
						fy += ret.fy * mul;
						fz += ret.fz * mul;
					}
					if('friction' in ret)
						friction += ret.friction;
					if('restitution' in ret)
						restitution *= ret.restitution;
				}
			}
		}

		// 2: project [vx,vy,vz] to plane defined by normal vector [nx,ny,nz]

		// Point on plane = point-normal*((point)dot(normal))/(|normal|^2)
		//
		var svx,svy,svz;
		var d = (vx*nx+vy*ny+vz*nz)/(nx*nx+ny*ny+nz*nz);

		svx = vx-nx*d;
		svy = vy-ny*d;
		svz = vz-nz*d;
		
		// 3. Calculate current delta velocity between objects, project it to the same plane and subtract it from SV. Store in SV.
		var dvx = o2.vx-o1.vx;
		var dvy = o2.vy-o1.vy;
		var dvz = o2.vz-o1.vz;

		d = (dvx*nx+dvy*ny+dvz*nz)/(nx*nx+ny*ny+nz*nz);

		dvx = dvx-nx*d;
		dvy = dvy-ny*d;
		dvz = dvz-nz*d;
	
		svx = -svx-dvx;
		svy = -svy-dvy;
		svz = -svz-dvz;
		
		// 4. Friction force = -SV/|SV|*friction multiplier*displacement. Add to [fx,fy,fz]

		// We will also project both objects' velocities to the collision axis and calculate friction based on that...
		var o1v = (o1.vx*nx+o1.vy*ny+o1.vz*nz);// /(nx*nx+ny*ny+nz*nz); normal vector is normal
		var o2v = (o2.vx*nx+o2.vy*ny+o2.vz*nz);// /(nx*nx+ny*ny+nz*nz);
		
		var vcontact = displacement;
		
		fx += nx*vcontact/2;
		fy += ny*vcontact/2;
		fz += nz*vcontact/2;
			
		d = (svx*svx+svy*svy+svz*svz);
		if(d > 0)
		{
			d = Math.sqrt(d);
			svx /= d;
			svy /= d;
			svz /= d;
			// at this point svx,svy,svz defines the direction of the friction force

			vcontact = -o1v-o2v+displacement;
			
			friction *= vcontact * 10;
					
			if(friction > d)friction = d;		
			if(friction < 0)friction = 0;
			
			svx*=friction;
			svy*=friction;
			svz*=friction;

			fx -= svx/2;
			fy -= svy/2;
			fz -= svz/2;
		}

		o1.fx += fx;
		o1.fy += fy;
		o1.fz += fz;
		o2.fx -= fx;
		o2.fy -= fy;
		o2.fz -= fz;
	
		if(!o1.fixed && !o2.fixed)
		{
			restitution = 0;

			var msum = o1.mass + o2.mass;

			// o1v, o2v are velocities projected to normal axis
			// momentum is preserved, for the time being restitution is always 0 until someone rewrites this collision response function.
			// = i cant get it to work right.
			var momentum = o1.mass*o1v + o2.mass*o2v;
			
			var o1nv = (momentum + o2.mass*restitution*(o2v-o1v))/msum;
			var o2nv = (momentum + o1.mass*restitution*(o1v-o2v))/msum;

			// velocities have been determined on the normal axis, all we need to do now is
			// shift the velocities in 3d space by the numbah.
			
			o1v -= o1nv;
			o2v -= o2nv;

			o1.vx -= o1v*nx;
			o1.vy -= o1v*ny;
			o1.vz -= o1v*nz;
			o2.vx -= o2v*nx;
			o2.vy -= o2v*ny;
			o2.vz -= o2v*nz;
		}
		else {
			// one of the objects is fixed, other not (collision between two fixed objects is not possible)
			var fixed  = o1.fixed?o1:o2;
			var mobile = o1.fixed?o2:o1;
			var mult = o1.fixed?-1:1;

			// what we do here is prevent the mobile object from entering the fixed one
			var dotp = (mobile.vx*nx+mobile.vy*ny+mobile.vz*nz);
			dotp *= mult;
			if(dotp < 0)
			{
				// project mobile's velocity to the surface normal, this way we eliminate the normal component.
				d = (dotp)/(nx*nx+ny*ny+nz*nz);
				mobile.vx = mobile.vx-nx*d;
				mobile.vy = mobile.vy-ny*d;
				mobile.vz = mobile.vz-nz*d;
			}
		}
	}
};

// Collide two objects
// return false if no collision
// otherwise return [collision plane normal vector, amount of displacement]
// for example [[0,0,1], 0.1] means the two objects have penetrated 0.1 units and will have to be moved outwards eachother on the z axis
World._collide = function(o1, o2)
{
	// Quick bounding volume checks to rule obvious cases out:
	var dx = o2.x-o1.x;
	var dy = o2.y-o1.y;
	var dz = o2.z-o1.z;

	var tx = (o1.bx+o2.bx)/2;
	var ty = (o1.by+o2.by)/2;
	var tz = (o1.bz+o2.bz)/2;

	if(Math.abs(dx)>tx||Math.abs(dy)>ty||Math.abs(dz)>tz)
		return false;
	
	// Dispatch to dedicated worker functions
	var collisions = World._colliders[o1.shape.shape][o2.shape.shape](o1,o2);
	if(collisions.length == 0)
		return false;
	
	// We now have a list of points of collision. We select the one with 
	// smallest displacement
	var smallest = -1;
	var smallestval = 10;
	for(var i = 0; i < collisions.length; i++)
	{
		if(collisions[i].displacement < smallestval || smallest==-1)
		{
			smallestval = collisions[i].displacement;
			smallest = i;
		}
	}
	return collisions[smallest];
};
World._registerCollider = function(type1, type2, fn)
{
	if(World._colliders[type1] == undefined)
		World._colliders[type1] = {};
	if(World._colliders[type2] == undefined)
		World._colliders[type2] = {};
		
	World._colliders[type1][type2] = fn;
	World._colliders[type2][type1] = function(a,b){
		// We need to invert each axis here since we flip the order of the parameters..
		var ret = fn(b,a);
		var r;
		for(var i = 0; i < ret.length; i++)
		{
			r = ret[i];
			r.nx = -r.nx;
			r.ny = -r.ny;
			r.nz = -r.nz;
		}
		return ret;
	};
};
	
	
/*
	Collision detection functions
*/
(function()
{
	var BoxBoxCollision = function (a,b)
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
	var BoxCylinderCollision = function (box,cyl)
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
	var BoxSlopeCollision = function (box, slope)
	{
		return [];
	}
	var CylinderCylinderCollision = function (cyl1, cyl2)
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
	var CylinderSlopeCollision = function (cyl, slope)
	{
		var plane = [slope.shape.plane[0],slope.shape.plane[1],slope.shape.plane[2]];
		
		// If the slope is directed, rotate the plane vector..
		if(slope.shape.flags & World.DIRECTED)
			RotateVectorZ(plane, slope.direction*90+90);

		// Collide with a cube
		// Apply some collision filtering
		// Add collisions of our own if necessary
		// ???
		// Profit
		
		var cols = BoxCylinderCollision(cyl,slope);
		
		var dx = cyl.x-slope.x;
		var dy = cyl.y-slope.y;
		var dz = cyl.z-slope.z;

		// See on which side the cylinder is on?
		var dotp = dx*plane[0]+dy*plane[1]+dz*plane[2];
		if(dotp >= 0)
		{
			// collide with plane...
			// select top or bottom cylinder cap?
			var mult = plane[2]>0?1:-1;
			
			var ellipse = [cyl.x,cyl.y,cyl.z - cyl.bz/2 * mult];
			var w = cyl.bx/2;
			var h = cyl.by/2;
			var point = [ellipse[0], ellipse[1], ellipse[2]];
			
			var dir = [plane[0],plane[1]];
			if(plane[0] != 0 || plane[1] != 0)
			{
				// find point from ellipse that is closest to plane
				var d = Math.sqrt(dir[0]*dir[0]+dir[1]*dir[1]);
				debugger;
				dir[0]*=w/d;
				dir[1]*=h/d;
				point[0] -= dir[0];
				point[1] -= dir[1];
			}
			
			dx = point[0]-slope.x;
			dy = point[1]-slope.y;
			dz = point[2]-slope.z;
			
			var dist = (dx*plane[0]+dy*plane[1]+dz*plane[2])/Math.sqrt(dx*dx+dy*dy+dz*dz);
			var treshold = 0.1;
//			if(dist < -treshold)return cols;
			if(dist < treshold)
			{
				// collision.. 
				// if the closest point is close to the boundary, act as a box instead..
				var cpoint = [dx+dist*plane[0],dy+dist*plane[1],dz+dist*plane[2]];
			debugger;	
				if(	Math.abs(cpoint[0])>slope.bx/2 ||
					Math.abs(cpoint[1])>slope.by/2 ||
					/*Math.abs*/(cpoint[2])>slope.bz/2)
					return cols;

				return [new World.Collision(plane[0],plane[1],plane[2],-(dist-treshold))];
			}
			
			return [];
		}
		else 
			return cols;
	}
	var SlopeSlopeCollision = function (slope1, slope2)
	{
		return [];
	}

	World._registerCollider(	World.BOX,			World.BOX,			BoxBoxCollision				);
	World._registerCollider(	World.BOX,			World.CYLINDER,		BoxCylinderCollision		);
	World._registerCollider(	World.BOX,			World.SLOPE,	 	BoxSlopeCollision			);
	World._registerCollider(	World.CYLINDER,		World.CYLINDER,		CylinderCylinderCollision	);
	World._registerCollider(	World.CYLINDER,		World.SLOPE,		CylinderSlopeCollision		);
	World._registerCollider(	World.SLOPE,		World.SLOPE,		SlopeSlopeCollision			);
})();

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
