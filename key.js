

var KEY_LEFT = 37;
var KEY_RIGHT = 39;
var KEY_UP = 38;
var KEY_DOWN = 40;

var Key = {
	_key : {},

	// Filter unwanted keypress events
	_shouldFilter : function(keycode){
		// It handles PgUp(33), PgDn(34), End(35), Home(36), Left(37), Up(38), Right(39), Down(40)
		var ar=new Array(33,34,35,36,37,38,39,40);
		for(var i=0;i<ar.length;i++) {
			if(keycode == ar[i])
			{
			  return true;
			}
		}
		return false;
	},
	register : function(){
		document.onkeydown = Key.keydown;
		document.onkeyup = Key.keyup;
	},
	keydown : function(evt){
		evt = (evt) ? evt : ((window.event) ? event : null);
		Key._key[evt.keyCode] = true;
		return !Key._shouldFilter(evt.keyCode);
	},
	keyup : function(evt){
		evt = (evt) ? evt : ((window.event) ? event : null);
		Key._key[evt.keyCode] = false;
		return !Key._shouldFilter(evt.keyCode);
	},
	get : function(keycode)
	{
		var ret = Key._key[keycode];
		if(ret == undefined)
			return false;
		return ret;
	}
}

