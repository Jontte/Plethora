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
  	// Hide cache and main canvases
  	$('#cache').hide();
  	$('#canvas').hide();
  	
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
				
				Config.level_table.reload();
				
				showSuccessToast('Level saved!');
			}
		})
	});

	// Setup extra info dialogs
	$.each(['about','tech','todo','author'], function(idx, dlg){
		$('#'+dlg+'-text').dialog({
				//modal:true,
				autoOpen: false,
				maxHeight: 400,
				width: 600,
				resizable: false,
				draggable: false,
				show: 'slide',
				hide: 'slide'
		});
		$('#'+dlg+'-button').click(function(){
			closeAllDialogs();
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
	var levelSelectorPanel = $('#level-selector-panel').dialog({
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
		var wasOpen = levelSelectorPanel.dialog('isOpen');
		closeAllDialogs();
		if ( !wasOpen )
			levelSelectorPanel.dialog('open');
	});
	Config.level_table = $('#level-selector-grid').dataTable( {
		"bProcessing": true,
		"sAjaxSource": "api.php?action=getLevelList",
		"bJQueryUI": true,
		"sPaginationType": "full_numbers",
		"sAjaxDataProp": "levels",
		"aoColumns": [
			{ "mDataProp": "id" ,		"bVisible" : false	},
			{ "mDataProp": "updated",	"sWidth": "20%", 
				"fnRender": function ( oObj ) {
					return relative_time(new Date(parseInt(oObj.aData.updated)*1000));
				}
			},
			{ "mDataProp": "name" ,		"sWidth": "30%" 	},
			{ "mDataProp": "desc" ,		"sWidth": "35%" 	},
			{ "mDataProp": "user_id",	"bVisible": false	},
			{ "mDataProp": "username",	"sWidth": "15%" 	}
		],
		"bAutoWidth": false,
		"fnServerData": function ( sSource, aoData, fnCallback ) {
			// Intercept ajax call so that we can call reset() when the table gets its data
			$.getJSON( sSource, aoData, function (json) { 
				fnCallback(json)
				reset();
			} );
		}
	});
	$("#level-selector-grid tbody").click(function(event) {
        $(Config.level_table.fnSettings().aoData).each(function (){
			$(this.nTr).removeClass('row_selected');
		});
		$(event.target.parentNode).addClass('row_selected');
		reset();
	});
	
	var p = $.getUrlVar('editor');
	if(typeof(p) != 'undefined')
		$('#sw-radio-edit').attr('checked', 'checked');

	$('#resetbutton').button().click(reset);

	$('#sw-radio').buttonset();
	$('#sw-radio-play').click(reset);
	$('#sw-radio-edit').click(reset);
	
	initiateSession();
});

function level_select()
{
	// Find out which row was selected in table and get info
	var table = Config.level_table;
	var aTrs = table.fnGetNodes();

	// get selected
	for ( var i=0 ; i<aTrs.length ; i++ )
	{
		if ( $(aTrs[i]).hasClass('row_selected') )
		{
			// The level has been selected! Save it as a cookie
			var d = table.fnGetData(i);
			setCookie('level_selection', d.id);
	
			return d;
		}
	}
	
	// Select the level saved in the cookie
	var levelInCookie = getCookie('level_selection');
	if ( levelInCookie ){
		$('#level-selector-grid tbody tr').removeClass('row_selected');
		
		var returnData = null;
		$(Config.level_table.fnSettings().aoData).each(function (){
			if ( this._aData.id == levelInCookie ){
				$(this.nTr).addClass('row_selected');
				returnData = table.fnGetData(this._iId);
			}
		});
		if ( returnData )
			return returnData;
	}
	
	return table.fnGetData(0); // load first level in case none are selected
}

function reset(areyousure)
{
	// areyousure comes from a callback where we ask the user if they really want to run plethora under their underpowered browser
	
	if(navigator.browserData.name == 'MSIE')
	{
		if(areyousure == undefined && !Config.areyousure)
		{
			$('#intro').hide();
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
	
	// Take the level selector panel down...
	$('#level-selector-panel').dialog('close');

	// Select & load level
	var level_data = level_select();
	if(typeof(level_data) == 'undefined')
		return;
	var levelid = level_data.id;

	// Show friendly toast message
	var message = '<h2>'+level_data.name+'</h2>';
	message += '<p>'+level_data.desc+'</p>'
	if(level_data.username != null)
		message += '<p>Author: '+level_data.username+'</p>'
	// TODO: show rating too
	
	showToast({
		text: message,
		type: 'notice',
		stayTime: 5000
	});

	if(!levelid || levelid == '')
	{
		return;
	}
	
	// Game is about to be loaded, hide intro
	$('#intro').hide();
  	$('#canvas').show();
	
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
			e.onload = function()
			{
				if(--Config.preloader.counter==0)
				{
					// Last image preloader calls initialize();
					initialize();
				}
			};
			// console.log('Precaching '+World.preload[i]);
			e.src = World.preload[i];
			Config.preloader.elements.push(e);
		}
	};
	
	// Not in level cache yet?
	if( !Config.level_cache[levelid] || !Config.level_cache[levelid].data )
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
function initialize()
{
	var canvas = document.getElementById('canvas');  
	canvas.focus();
	Graphics.ctx = canvas.getContext('2d');

	// Start registering keyboard input
	Key.register();

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
