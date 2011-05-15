/*
 * Configurables
 */

var Config = {
	gamestate : 'halt',
	FPS: 30,
	areyousure: false, //Whether the user is willing to try plethora despite using browsers with poor performance
	editor: false //Whether we're in editor mode or not
};
var Graphics = {
	ctx : null,
	img : []
};

$(document).ready(function(){

	$.each(['about','tech','todo','author'], function(idx, dlg){
		$('#'+dlg+'-text').dialog({
				modal:true,
				autoOpen: false,
				maxHeight: 400,
				width: 600,
				resizable: false,
				draggable: false,
				show: 'slide',
				hide: 'slide'
		});
		$('#'+dlg+'-button').button().click(function(){
			$('#'+dlg+'-text').dialog('open');
		});
	});
	
	var p = $.getUrlVar('editor');
	if(typeof(p) != 'undefined')
		$('#sw-radio-edit').attr('checked', 'checked');

	$('#resetbutton').button().click(reset);

	$('#sw-radio').buttonset();
	$('#sw-radio-play').click(reset);
	$('#sw-radio-edit').click(reset);
	reset();
});

function reset(areyousure)
{
	// areyousure comes from a callback where we ask the user if they really want to run plethora under their underpowered browser
	
	if(navigator.browserData.name == 'MSIE')
	{
		if(areyousure == undefined && !Config.areyousure)
		{
			document.getElementById('browser-warning').style.visibility = 'visible';
			document.getElementById('canvas').style.visibility = 'hidden';
			return;
		}
		else
		{
			// Let's remember the user option for now.
			Config.areyousure = true;
			document.getElementById('browser-warning').style.visibility = 'hidden';
			document.getElementById('canvas').style.visibility = 'visible';
		}
	}
	
	if(Config.gamestate == 'online')
	{
		Config.gamestate = 'reset';
		// Try again in 50ms
		setTimeout(reset, 50);
		return;
	}
	if(Config.gamestate != 'halt')
		return;

	Config.gamestate = 'initializing';

	World.reset();

	// Select & load level
	var levelname = document.getElementById('lselect').value;

	// The level has been selected! Save it as a cookie
	setCookie('level_selection', levelname);

	// Load level and initialize
	$.getJSON('index.php?level='+levelname, function(json){
	
		var use_editor = $('#sw-radio-edit').is(':checked');
	
		World.loadLevel(levelname, json, use_editor);
		initialize();
	});
}
function load_gfx(filename, onload)
{
	// Makes sure an external img file is loaded into memory
	// Optional onload function may be specified
	if(!Graphics.img[filename])
	{
		var img = new Image();
		img.src = filename;
		if(onload)
		{
			img.onload = onload;
		}
		Graphics.img[filename] = img;
	}
}
function initialize()
{
	var canvas = document.getElementById('canvas');  
	canvas.focus();
	Graphics.ctx = canvas.getContext('2d');

	// Start registering keyboard input
	Key.register();

	load_gfx('cloud1.png');
	load_gfx('cloud2.png');
	load_gfx('cloud3.png');
	load_gfx('cloud4.png');
	load_gfx('cloud5.png');
	load_gfx('stars.png');
	load_gfx('tileset.png');

	Config.gamestate = 'online';
	Config.intervalID = setInterval(game_loop, 1000/Config.FPS);
}

function game_loop()
{
	if(Config.gamestate != 'online')
	{
		clearInterval(Config.intervalID);
	}
	if(Config.gamestate == 'reset')
	{
		Config.gamestate = 'halt';
		return;
	}

	// Clear screen
	Graphics.ctx.fillRect (0, 0, 640, 480);  	

	World.render();
	World.physicsStep();

	// Reset key states
	Key.timestep();
}


