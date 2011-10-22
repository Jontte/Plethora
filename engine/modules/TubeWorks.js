/*
 * TubeWorks module
 * Version 0.1
*/

World.addModule('TubeWorks',
{
	preload: ['img/mod_tubeworks.png'],
	load : function()
	{
		// Load tiles and graphics
		var tiles = World.addTileset('img/mod_tubeworks.png');
		
		/*World.addClass('kissa', {
			tileset: tiles,
			category: 'tubes',
			tiles: [0,0]
		});*/
	}
});

