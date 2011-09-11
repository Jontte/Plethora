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
		if ( !currentUser ){
			showErrorToast('You have to be logged in to save a level!');
			return;
		}
		
		var levelData = World.saveLevel();
		var levelid = World.getLevelName();
		
		var overwriting = Config.level_cache[levelid] && Config.level_cache[levelid].user_id == currentUser.id;
		var level = overwriting ? Config.level_cache[levelid] : {
			'id': (new Date).getTime(),
			'name': 'New Level',
			'updated': null,
			'user_id': currentUser.id,
			'username': currentUser.username
		};
		level.data = levelData;
		var oldid = level.id;
		
		$.postJSON('api.php', {
			'action': 'saveLevel', // sid, [id], name, [desc], data
			'sid': currentUser.sid,
			'id': overwriting ? level.id : undefined,
			'name': level.name,
			'desc': level.desc || undefined,
			'data': JSON.stringify(level.data)
		}, function(data){
			if ( data.error )
				showErrorToast(data.error);
			else{
				if ( data.id != oldid ){
					level.id = data.id;
					Config.level_cache[data.id] = level;
					delete Config.level_cache[oldid];
				}
				
				if ( $('#lselect option[value='+level.id+']').length == 0 ){
					var option = $('<option>', {
						'value': level.id,
						'text': level.name,
						'selected': 'selected'
					});
					$('#lselect').append(option);
				}
				
				showSuccessToast('Level saved!');
			}
		})
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
	
	//$('#toast-message').hide();
	
	// Setup login panel
	$('#login-panel').dialog({
		modal: true,
		autoOpen: false,
		maxHeight: 400,
		width: 800,
		resizable: true,
		draggable: true,
		show: 'slide',
		hide: 'fade'
	});
	$('#login-panel-button').button().click(function(){
		if ( $('#register-captcha #recaptcha_area').length > 0 )
			Recaptcha.reload();
		else
			createCaptcha($('#register-captcha'));
		$('#login-panel').dialog('open');
	});
	$('#logout-button').button().click(function(){
		showNoticeToast('Logged out!');
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
				showErrorToast(retu.error);
			else{
				showSuccessToast('Logged in as ' + retu.username + '!');
				initiateSession(retu);
			}
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
			showErrorToast('Passwords do not match!');
			return false;
		}
		
		$.getJSON('api.php', {
			'action': 'register',
			'username': data['username'],
			'password': SHA1(data['password']),
			'captcha_challenge': Recaptcha.get_challenge(),
			'captcha_response': Recaptcha.get_response()
		}, function(retu){
			if ( retu && retu.error ){
				showErrorToast(retu.error);
				Recaptcha.reload();
			}
			else{
				showSuccessToast('User account created!');
				initiateSession(retu);
			}
		});

		return false;
	});
	
	// Setup level selector dialogs and grid
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
	$('#level-selector-grid').dataTable( {
		"bProcessing": true,
		"sAjaxSource": "api.php?action=getLevelList",
		"aoColumns": [
			{ "mDataProp": "id" },
			{ "mDataProp": "updated" },
			{ "mDataProp": "name" },
			{ "mDataProp": "desc" },
			{ "mDataProp": "user_id" },
			{ "mDataProp": "username" }
		]
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
	$.getJSON('api.php', {
		'action': 'getLevelList'
	}, function(json){
		var lastlevel = getCookie('level_selection');
		// see if lastlevel exists in json..
		var found = false;
		for(var i = 0 ; i < json.length; i++)
		{
			if(json[i].id == lastlevel)
			{
				found = true;
				break;
			}
		}
		if(found==false)
		{
			// select the first level...
			lastlevel = json[0].id;
		}
		for(var i = 0 ; i < json.length; i++)
		{
			var level = json[i];
			var s = '';
			if(lastlevel == level.id)
			{
				s = ' selected="true"';
			}
			$('#lselect').append('<option value="'+level.id+'"'+s+'>'+level.name+'</option>');	
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
	var levelid = document.getElementById('lselect').value;

	if(!levelid || levelid == '')
	{
		return;
	}
	// The level has been selected! Save it as a cookie
	setCookie('level_selection', levelid);
	
	
	function fn(levelid)
	{
		var json = Config.level_cache[levelid];
		Config.gamestate = 'initializing';
		
		var use_editor = $('#sw-radio-edit').is(':checked');
		
		var savebtn = $('#save-btn');

		if(use_editor)
			savebtn.show();
		else
			savebtn.hide();
		
		World.loadLevel(json.id, json.data, use_editor);
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
	if(!(levelid in Config.level_cache))
	{
		// load it there
		$.getJSON('api.php', {
			'action': 'getLevel',
			'id': levelid
		}, function(json){
			json.data = JSON.parse(json.data);
			Config.level_cache[levelid] = json;
			fn(levelid);
		});
	}
	else
	{
		fn(levelid);
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
	if ( currentUser && currentUser.sid ){
		$.getJSON('api.php', {
			'action': 'logout',
			'sid': currentUser.sid
		}, function(){
			$('#login-panel-button').show();
		});
	}
	
	currentUser = null;
	setCookie('sid', '');
	
	$('#logout-button').hide();
}
