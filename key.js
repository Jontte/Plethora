/* 
 * A simple keymanager
 */

var KEY_LEFT = 37;
var KEY_RIGHT = 39;
var KEY_UP = 38;
var KEY_DOWN = 40;
var KEY_SPACE = 32;

var Key = {
	_key : {}, // Current states of the keys
	_changed : {}, // Whether this key was recently changed

	// Filter unwanted keypress events
	_shouldFilter : function(keycode){
		// It handles PgUp(33), PgDn(34), End(35), Home(36), Left(37), Up(38), Right(39), Down(40), Spacebar(32)
		var ar=new Array(33,34,35,36,37,38,39,40,32);
		return (ar.indexOf(keycode) != -1);
	},
	timestep : function(){
		// Set changed=false for every key. Called automatically from main.js every frame
		for(var key in Key._changed)
		{
			if(!Key._changed.hasOwnProperty(key))continue;
			Key._changed[key] = false;
		}
	},
	register : function(){
		document.onkeydown = Key.keydown;
		document.onkeyup = Key.keyup;
	},
	keydown : function(evt){
		evt = (evt) ? evt : ((window.event) ? event : null);
		if(Key._key[evt.keyCode] != true)
			Key._changed[evt.keyCode] = true;
		Key._key[evt.keyCode] = true;
		return !Key._shouldFilter(evt.keyCode);
	},
	keyup : function(evt){
		evt = (evt) ? evt : ((window.event) ? event : null);
		if(Key._key[evt.keyCode] != false)
			Key._changed[evt.keyCode] = true;
		Key._key[evt.keyCode] = false;
		return !Key._shouldFilter(evt.keyCode);
	},
	get : function(keycode)
	{
		var ret = Key._key[keycode];
		if(ret == undefined)
			return false;
		return ret;
	},
	changed : function(keycode)
	{
		var ret = Key._changed[keycode];
		if(ret == undefined)
			return false;
		return ret;
	}
}

