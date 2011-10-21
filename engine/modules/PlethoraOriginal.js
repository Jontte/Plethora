/*
 * PlethoraOriginal module
 * Version 1.1
*/

World.addModule('PlethoraOriginal',
{
	preload: ['img/tileset.png'],
	load : function()
	{
		// Load tiles and graphics
		var plethora_original = World.addTileset('img/tileset.png');
		var sandblock_samples = World.sampleTiles(plethora_original, 8, [[12,4],[12,5],[13,4],[13,5]]);
		
		World.addClass('groundplain', {
			tileset: plethora_original,
			category: 'terrain',
			tiles: [5,9]
		});
		World.addClass('bluewall', {
			tileset: plethora_original,
			category: 'obstacles',
			tiles: [8,3],
			size: [3,1,3],
			defaults: {
				mass: 20
			}
		});
		World.addClass('bigpillar', {
			tileset: plethora_original,
			category: 'obstacles',
			tiles: [10,3],
			size: [2,2,4],
			shape: World.CYLINDER
		});
		World.addClass('duck', {
			tileset: plethora_original,
			category: 'misc',
			tiles : [5,1],
			shape: World.CYLINDER,
			size: [0.5,0.5,0.5],
			defaults: {
				mass: 0.2
			}
		});
		World.addClass('dude',
		{
			tileset: plethora_original,
			flags: World.DIRECTED | World.ANIMATED,
			tiles: [
				[[0,4],[1,4],[2,4],[3,4]], // north
				[[4,2],[5,2],[6,2],[7,2]], // east
				[[0,2],[1,2],[2,2],[3,2]], // south
				[[4,4],[5,4],[6,4],[7,4]] // west
			],
			shape: World.CYLINDER,
			size: [0.9,0.9,2],
			category: 'characters',
			defaults: {
				mass: 1
			},
			init: function(params){
				if(typeof(params) != 'object')params = {};
				
				this.walkx = this.walky = 0;
				this.jumping = true;
				
				this.frameMaxTicks=0;

				if(!World._editor.online)
					World.setCameraFocus(this);
		
				this.collision_listener = function(self, other, nx, ny, nz, displacement){
					if(nz>0)
					{
						// Note that we have to limit the jumps to once per frame..
						var jump = 0.35*(self.jumping);
						self.jumping = false;
						return {
							vx: self.walkx,
							vy: self.walky,
							vz: 0,
							fx: 0,
							fy: 0,
							fz: jump,
							friction: 1
						};
					}
					return true;
				};
			},
			step: function(){
				var plr = this;
				var d = 0.15;
	
				var movement_x = 0;
				var movement_y = 0;
	
				if(Key.get(KEY_LEFT)){ 
					movement_x -= 1;
				}
				if(Key.get(KEY_RIGHT)){ 
					movement_x += 1;
				}
				if(Key.get(KEY_UP)){
					movement_y -= 1;
				}
				if(Key.get(KEY_DOWN)){ 
					movement_y += 1;
				}
				this.jumping = Key.get(KEY_SPACE);

				// Inhibit diagonal movement
				var dd = Math.sqrt(movement_x*movement_x+movement_y*movement_y);
				if(dd>0)
				{
					movement_x *= d/dd;
					movement_y *= d/dd;
				}

				plr.walkx = movement_x;
				plr.walky = movement_y;

				if(Key.get(KEY_LEFT))
				{
					plr.direction = World.WEST;
				}
				else if(Key.get(KEY_UP))
				{
					plr.direction = World.NORTH;
				}
				else if(Key.get(KEY_RIGHT))
				{
					plr.direction = World.EAST;
				}
				else if(Key.get(KEY_DOWN))
				{
					plr.direction = World.SOUTH;
				}
	
				var speed = (plr.vx*plr.vx+plr.vy*plr.vy);
				var maxticks = (speed<0.001) ? 0 : 0.10/speed;
				plr.frameMaxTicks = maxticks;
	
				World.drawSimpleObject(this);
			}
		});
		World.addClass('creeper', {
			tileset: plethora_original,
			flags: World.DIRECTED | World.ANIMATED,
			tiles: [
				[[0,14],[1,14],[2,14],[3,14],[4,14]],
				[[5,12],[6,12],[7,12],[8,12],[9,12]],
				[[0,12],[1,12],[2,12],[3,12],[4,12]],
				[[5,14],[6,14],[7,14],[8,14],[9,14]]
			],
			shape: World.CYLINDER,
			size: [0.9,0.9,2],
			category: 'characters',
			defaults:{
				mass: 1
			},
			init: function(params){	
				this.walkx = this.walky = 0;
				this.frameMaxTicks=0;
				this.collision_listener = function(self, other, nx, ny, nz, displacement){
					if(nz>0)
					{
						return {
							vx: self.walkx,
							vy: self.walky,
							vz: 0
						};
					}
					return true;
				};
				this.counter = 0;
				this.targetdir = 0;
			},
			step: function(){
				var d = 0.13;
	
				if(--this.counter <= 0)
				{
					this.targetdir = Math.floor(Math.random()*5.99);
					this.counter = Math.floor(Math.random()*30*3);
				}
				var movement_x = this.targetdir==1?d:(this.targetdir==3?-d:0);
				var movement_y = this.targetdir==0?-d:(this.targetdir==2?d:0);
				
				// measure distance to camera center (player location)
				var pdx = (World._cameraPosX-this.x);
				var pdy = (World._cameraPosY-this.y);
				var pdz = (World._cameraPosZ-this.z);
				var pdist = Math.sqrt(pdx*pdx+pdy*pdy+pdz*pdz);
				if(pdist < 5)
				{
					// normalize pdx and pdy in xy plane
					pdist = Math.sqrt(pdx*pdx+pdy*pdy);
					if(pdist > 0.1)
					{
						pdx /= pdist;
						pdy /= pdist;
						movement_x = d*pdx;
						movement_y = d*pdy;
					}
					else
					{
						movement_x = 0;
						movement_y = 0;
					}
				}
	
				// Inhibit diagonal movement
				var dd = Math.sqrt(movement_x*movement_x+movement_y*movement_y);
				if(dd>0)
				{
					movement_x *= d/dd;
					movement_y *= d/dd;
				}

				this.walkx = movement_x;
				this.walky = movement_y;
				
				var comp = [Math.abs(movement_x), Math.abs(movement_y)];
				if(comp[0] > comp[1])
				{
					this.direction = movement_x>0?1:3;
				}
				else if(comp[1] > comp[0])
				{
					this.direction = movement_y>0?2:0;
				}

				var speed = (this.vx*this.vx+this.vy*this.vy);
				var maxticks = (speed<0.001) ? 0 : 0.5*0.10/speed;
				this.frameMaxTicks = maxticks;
	
				World.drawSimpleObject(this);
			}
		});
		World.addClass('groundrugged', {
			tileset: plethora_original,
			category: 'terrain',
			tiles: [1,9]
		});
		World.addClass('groundblock', {
			tileset: plethora_original,
			category: 'terrain',
			tiles: [3,9]
		});
		World.addClass('sandfencex', {
			tileset: plethora_original,
			category: 'architecture',
			tiles: [12,3],
			size: [1,0.5,1]
		});
		World.addClass('sandfencey', {
			tileset: plethora_original,
			category: 'architecture',
			tiles: [13,3],
			size: [0.5,1,1]
		});
		World.addClass('sandblock', {
			tileset: sandblock_samples,
			category: 'terrain',
			flags: World.ANIMATED_RANDOM,
			tiles: [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0]],
			init: function(){
				this.frameMaxTicks=0; // disable animation
			}
		});
		/*World.addClass('big_tile', {
			tileset: plethora_original,
			category: 'terrain',
			size: [2,2,1],
			tiles: [14,4.5]
		});*/
		
		World.addClass('lift', {
			tileset: plethora_original,
			tiles: [[0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6]],
			category: 'transport',
			flags: World.ANIMATED,
			defaults: {
				/*
					Plethora currently does not support 'actors', aka objects that do not participate in collision response
					We emulate one by having a large mass and manually setting position every frame
					Ugly, but works well enough
				*/
				mass: 1000000
			},
			init : function(params)
			{
				this.frameMaxTicks = 0; // Disable automatic animation
				//this.frameMaxTicks = 5;
		
				this.mode = 'automatic'; // Nox-style
				this.state = 'waiting';
				this.waitTicks = 0;
				this.waitMaxTicks = 25;
				this.animMaxTicks = 3; // ticks per frame
				this.hasGravity = false;
				this.collideFixed = false;
				this.startpos = [this.x,this.y,this.z];
			},
			step : function()
			{
				// Step any existing lifts...
				if(this.state == 'waiting')
				{
					this.waitTicks++;
					if(this.waitTicks >= this.waitMaxTicks)
					{
						this.waitTicks = 0;
						if(this.frame == 0)
							this.state = 'ascending';
						else
							this.state = 'descending';
					}
				}
				else if(this.state == 'ascending' || this.state == 'descending')
				{
					this.waitTicks++;
				
					if(this.waitTicks >= this.animMaxTicks)
					{
						this.waitTicks = 0;
					
						if(this.state == 'ascending')
							this.frame++;
						else
							this.frame--;
				
						if(this.frame>=15 || this.frame <= 0)
						{
							if(this.mode=='automatic')
								this.state = 'waiting';
							else
								this.state = 'standby';
						}
					}
				}
				// TODO
				
				this.setPos([
					this.startpos[0],
					this.startpos[1],
					this.startpos[2] - this.frame/15.1
				]);
				
				World.drawSimpleObject(this, 0);
			}
		});
		World.addClass('water', {
			tileset: plethora_original,
			category: 'terrain',
			flags: World.ANIMATED_RANDOM,
			tiles: [[2,0],[3,0]]
		});
		World.addClass('barrelwooden', {
			tileset: plethora_original,
			category: 'obstacles',
			tiles: [2,1],
			shape: World.CYLINDER,
			defaults: {
				mass: 1
			}
		});
		World.addClass('crate', {
			tileset: plethora_original,
			category: 'obstacles',
			tiles: [3,1],
			defaults: {
				mass: 1
			}
		});
		World.addClass('famouscube', {
			tileset: plethora_original,
			category: 'misc',
			tiles: [4,1],
			defaults: {
				mass: 1
			}
		});
		World.addClass('shadow', {
			tileset: plethora_original,
			internal: true,
			tiles: [8,1],
			shape: World.CYLINDER
		});
		World.addClass('darkblock', {
			tileset: plethora_original,
			category: 'architecture',
			tiles: [0,11],
			shape: World.BOX, 
			size: [1,1,0.5]
		});
		World.addClass('fencex', {
			tileset: plethora_original,
			category: 'architecture',
			tiles:[4,0], 
			shape: World.BOX, 
			size: [1,0.5,1]
		});
		World.addClass('fencey', {
			tileset: plethora_original,
			category: 'architecture',
			tiles:[5,0], 
			shape: World.BOX,
			size: [0.5,1,1]
		});
		World.addClass('belt', {
			tileset: plethora_original,
			category: 'transport',
			flags: World.ANIMATED|World.DIRECTED, 
			tiles: [
				[[14,1],[13,1],[12,1],[11,1],[10,1]],
				[[10,0],[11,0],[12,0],[13,0],[14,0]],
				[[10,1],[11,1],[12,1],[13,1],[14,1]],
				[[14,0],[13,0],[12,0],[11,0],[10,0]]
			], 
			shape: World.BOX,
			size: [1,1,0.5],
			defaults: {
				mass: 0
			},
			init: function(){
				this.collision_listener = function(self, other, nx, ny, nz, displacement){
					if(nz<0) {
						var v = 10;
						switch(self.direction){
							case 0: vec=[ 0, v]; break;
							case 1: vec=[-v, 0]; break;
							case 2: vec=[ 0,-v]; break;
							case 3: vec=[ v, 0]; break;
						};
						return {
							vx: vec[0]*displacement,
							vy: vec[1]*displacement,
							vz: 0
						};
					}
					return true;
				};
			}
		});
		World.addClass('famouslogo', {
			tileset: plethora_original,
			category: 'misc',
			tiles: [9,1],
			defaults: {
				mass: 1
			}
		});
		World.addClass('redblock', {
			tileset: plethora_original,
			category: 'misc',
			flags: World.ANIMATED,
			tiles: [[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2]],
			defaults: {
				mass: 1
			},
			init: function(params){this.hasGravity = false;}
		});
		/*World.addClass('greenslope', {
			tileset: plethora_original,
			category: 'terrain',
			flags: World.DIRECTED,
			tiles: [[0,9],[1,8],[0,8],[0,10]], 
			shape: World.SLOPE
		});*/
	}
});

