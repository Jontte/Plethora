/* 
 * A simple keymanager
 */

var KEY_LEFT = 37;
var KEY_RIGHT = 39;
var KEY_UP = 38;
var KEY_DOWN = 40;
var KEY_SPACE = 32;
var KEY_PAGEUP = 33;
var KEY_PAGEDOWN = 34;
var KEY_CTRL = 17;
var KEY_ALT = 18;

// Mouse codes are arbitrary
var MOUSE_LEFT = 201;
var MOUSE_MIDDLE = 202;
var MOUSE_RIGHT = 203;
var MOUSE_WHEEL_UP = 204;
var MOUSE_WHEEL_DOWN = 205;

var Key = {
	_key : {}, // Current states of the keys
	_changed : {}, // Whether this key was recently changed
	_timeheld: {}, // How many steps this key has been pressed

	// Filter unwanted keypress events
	_shouldFilter : function(keycode){
        // TODO: Is it fine not to filter any keys?
		return false;
        // It handles PgUp(33), PgDn(34), End(35), Home(36), Left(37), Up(38), Right(39), Down(40)
		/*var ar=new Array(33,34,35,36,37,38,39,40);
		return (ar.indexOf(keycode) != -1);*/
	},
	timestep : function(){
		// Set changed=false for every key. Called automatically from main.js every frame
		for(var key in Key._changed)
		{
			if(!Key._changed.hasOwnProperty(key))continue;
			Key._changed[key] = false;
		}
		// Increment timeheld
		for(var key in Key._key)
		{
			if(!Key._key.hasOwnProperty(key))continue;
			if(Key._key[key] == true)
				Key._timeheld[key] ++;
		}
	},
	register : function(target_element){
		$(document).keydown(Key.keydown);
		$(document).keyup(Key.keyup);
		$(target_element).mousedown(Key.mousedown);
		$(target_element).mouseup(Key.mouseup);
		$(target_element).mousewheel(function(event, delta, deltaX, deltaY) {
			// Note the use of keyhit function here. Mouse wheel has no up/down state
			// Using keyhit here ensures timeheld() and get() return 0
			if(deltaY > 0)
				Key.keyhit({keyCode:MOUSE_WHEEL_UP});
			if(deltaY < 0)
				Key.keyhit({keyCode:MOUSE_WHEEL_DOWN});
		})
	},
	mousedown: function(evt){
		     if(evt.which == 1)return Key.keydown({keyCode:MOUSE_LEFT});
		else if(evt.which == 2)return Key.keydown({keyCode:MOUSE_MIDDLE});
		else if(evt.which == 3)return Key.keydown({keyCode:MOUSE_RIGHT});
	},
	mouseup: function(evt){
		     if(evt.which == 1)return Key.keyup({keyCode:MOUSE_LEFT});
		else if(evt.which == 2)return Key.keyup({keyCode:MOUSE_MIDDLE});
		else if(evt.which == 3)return Key.keyup({keyCode:MOUSE_RIGHT});
	},
	keydown : function(evt){
		if(Key._key[evt.keyCode] != true)
		{
			Key._changed[evt.keyCode] = true;
			Key._timeheld[evt.keyCode] = 0;
		}
		Key._key[evt.keyCode] = true;
		return !Key._shouldFilter(evt.keyCode);
	},
	keyup : function(evt){
		if(Key._key[evt.keyCode] != false)
		{
			Key._changed[evt.keyCode] = true;
			Key._timeheld[evt.keyCode] = 0;
		}
		Key._key[evt.keyCode] = false;
		return !Key._shouldFilter(evt.keyCode);
	},
	keyhit: function(evt){
		Key.keydown(evt);
		Key.keyup(evt);		
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
	},
	timeHeld : function(keycode)
	{
		var ret = Key._timeheld[keycode];
		if(ret == undefined)
			return false;
		return ret;
	}
}

