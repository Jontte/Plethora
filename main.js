/*
 * Configurables
 */

var Config = {
	gamestate : 'halt',
	FPS: 30,
	areyousure: false, //Whether the user is willing to try plethora despite using browsers with poor performance
	editor: false, //Whether we're in editor mode or not
	level_cache : {},
	preloader: {
		counter: 0, // number of resources left
		elements: []
	}
};
var Graphics = {
	ctx : null,
	img : []
};


// TODO: move this to util.js
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
	return	window.requestAnimationFrame       || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame    || 
		window.oRequestAnimationFrame      || 
		window.msRequestAnimationFrame     || 
		function(/* function */ callback, /* DOMElement */ element){
			window.setTimeout(callback, 1000 / 30);
		};
})();

$(document).ready(function(){

	// Disable context menu on right click
	$(this).bind("contextmenu", function(e) {
        e.preventDefault();
    });
	// Start capturing mouse position...
	$('#canvas').mousemove(function(e){
		var x = e.pageX - this.offsetLeft;
		var y = e.pageY - this.offsetTop;
		World.mouseX = x;
		World.mouseY = y;
  	}); 
  	// Hide cache canvases
  	$('#cache').hide();
  	
 	$('#save-btn').button().hide().click(function(){
		var level = World.saveLevel();
		var src = 'custom_'+new Date().getTime();
		var levelname = 'custom';
		
		Config.level_cache[src]=level;
		$('#lselect').append('<option value="'+src+'">'+levelname+'</option>');	
	});
	
	// Setup extra info dialogs
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
	
	// Setup login panel
	$('#login-panel').dialog({
		modal: true,
		autoOpen: false,
		maxHeight: 400,
		width: 600,
		resizable: true,
		draggable: true,
		show: 'slide',
		hide: 'fade'
	});
	$('#login-panel-button').button().click(function(){
		$('#login-panel').dialog('open');
	});
	$('#logout-button').button().click(function(){
		destroySession();
	}).hide();

	$('#login-form').submit(function(){
		var data = {};
		$.each({
			'username': 'login-username',
			'password': 'login-password'
		}, function(key, val){
			data[key] = $('#'+val).val();
		});

		$.getJSON('api.php', {
			'action': 'login',
			'username': data['username'],
			'password': SHA1(data['password'])
		}, function(retu){
			if ( retu && retu.error )
				alert(retu.error);
			else
				initiateSession(retu);
		});

		return false;
	});

	$('#register-form').submit(function(){
		var data = {
			'action': 'register'
		};
		$.each({
			'username': 'register-username',
			'password': 'register-password',
			'password-again': 'register-password-again'
		}, function(key, val){
			data[key] = $('#'+val).val();
		});

		if ( data['password'] != data['password-again'] ){
			alert('Passwords do not match!');
			return false;
		}

		$.getJSON('api.php', {
			'action': 'register',
			'username': data['username'],
			'password': SHA1(data['password'])
		}, function(retu){
			if ( retu && retu.error )
				alert(retu.error);
			else
				initiateSession(retu);
		});

		return false;
	});
	
	// Setup level selector dialog
	$('#level-selector-panel').dialog({
		modal: false,
		autoOpen: false,
		maxHeight: 400,
		width: 600,
		resizable: true,
		draggable: true,
		show: 'slide',
		hide: 'fade'
	});
	$('#level-selector').button().click(function(){
		$('#level-selector-panel').dialog('open');
	});
	
	// Setup level selector grid
	
	var p = $.getUrlVar('editor');
	if(typeof(p) != 'undefined')
		$('#sw-radio-edit').attr('checked', 'checked');

	$('#resetbutton').button().click(reset);

	$('#sw-radio').buttonset();
	$('#sw-radio-play').click(reset);
	$('#sw-radio-edit').click(reset);
	
	// Request list of levels from server
	$.getJSON('index.php?level_list', function(json)
	{
		var lastlevel = getCookie('level_selection');
		// see if lastlevel exists in json..
		var found = false;
		for(var i = 0 ; i < json.length; i++)
		{
			if(json[i].src == lastlevel)
			{
				found = true;
				break;
			}
		}
		if(found==false)
		{
			// select the first level...
			lastlevel = json[0].src;
		}
		for(var i = 0 ; i < json.length; i++)
		{
			var level = json[i];
			var s = '';
			if(lastlevel == level.src)
			{
				s = ' selected="true"';
			}
			$('#lselect').append('<option value="'+level.src+'"'+s+'>'+level.name+'</option>');	
		};
		reset();
	});
	
	$('#lselect').change(reset);
	
	initiateSession();
});

function reset(areyousure)
{
	// areyousure comes from a callback where we ask the user if they really want to run plethora under their underpowered browser
	
	if(navigator.browserData.name == 'MSIE')
	{
		if(areyousure == undefined && !Config.areyousure)
		{
			$('#browser-warning').show();
			$('#canvas').hide();
			return;
		}
		else
		{
			// Let's remember the user option for now.
			Config.areyousure = true;
			$('#browser-warning').hide();
			$('#canvas').show();
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

	World.reset();

	// Select & load level
	var levelname = document.getElementById('lselect').value;

	if(levelname == '')
	{
		return;
	}
	// The level has been selected! Save it as a cookie
	setCookie('level_selection', levelname);
	
	
	function fn(levelname)
	{
		var json = Config.level_cache[levelname];
		Config.gamestate = 'initializing';
		
		var use_editor = $('#sw-radio-edit').is(':checked');
		
		var savebtn = $('#save-btn');

		if(use_editor)
			savebtn.show();
		else
			savebtn.hide();
		
		World.loadLevel(levelname, json, use_editor);
		// Let's preload a couple of images before calling initialize... 
		
		Config.preloader.counter = World.preload.length;
		Config.preloader.elements = [];
		for(var i = 0; i < World.preload.length; i++)
		{
			var e = new Image();
			e.onload = function(){
				if(--Config.preloader.counter==0)
				{
					// Last image preloader calls initialize();
					initialize();
				}
			};
			e.src = World.preload[i];
			Config.preloader.elements.push(e);
		}
	};
	
	// Not in level cache yet?
	if(!(levelname in Config.level_cache))
	{
		// load it there
		$.getJSON('index.php?level='+levelname, function(json){
			Config.level_cache[levelname] = json;
			fn(levelname);
		});
	}
	else
	{
		fn(levelname);
	}
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

	//window.requestAnimFrame(game_loop);

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

//	console.time('frame');

	// Clear screen
	Graphics.ctx.fillRect (0, 0, 640, 480);  	

	World.render();
	World.physicsStep();

	// Reset key states
	Key.timestep();
	
	//window.requestAnimFrame(game_loop);
//	console.timeEnd('frame');
}

var currentUser = null;
function initiateSession(data){
	if ( !data ){
		var sid = getCookie('sid');
		if ( !sid || sid == '' )
			return;
		
		initiateSession({
			'sid': sid
		})
		
		return;
	}
	
	function onSession(){
		currentUser = data;
		setCookie('sid', data.sid);
		
		$('#login-panel-button').hide();
		$('#login-panel').dialog('close');
		$('#logout-button').show();
		
		$('#login-panel input[type!=submit]').val('');
		
		if ( !data.id ){
			$.getJSON('api.php', {
				'action': 'getSessionData',
				'sid': data.sid
			}, function(retu){
				if ( !retu || retu.error )
					onNoSession();
				else if ( retu.id )
					initiateSession(retu);
			});
		}
	}
	
	function onNoSession(){
		$('#login-panel-button').show();
		$('#logout-button').hide();
	}
	
	if ( !data || !data.sid )
		onNoSession();
	else
		onSession();
}

function destroySession(){
	currentUser = null;
	setCookie('sid', '');
	$('#login-panel-button').show();
	$('#logout-button').hide();
}
