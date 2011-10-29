function fillRightToLeft(/* target, source, ... */){
	var args = Array.prototype.concat.apply([], arguments);
	var first = args.shift() || {};
	args.forEach(function(arg){
		for ( var key in arg ){
			if ( arg.hasOwnProperty(key) && first[key] === undefined )
				first[key] = arg[key];
		}
	});
	return first;
}

function debugWatch(obj, prop, breakOnSet){
	var val = obj[prop];
	delete obj[prop];
	
	obj.__defineGetter__(prop, function(){
		return val;
	});
	obj.__defineSetter__(prop, function(newVal){
		if ( breakOnSet )
			debugger;
		
		val = newVal;
		console.log(obj, '.'+prop, ' --> ', val);
	});
}

function sign(x)
{
	if(x>0)return 1;
	else if(x<0)return -1;
	return 0;
}

function wrap(val, max)
{
	while(val < 0)val += max;
	while(val >= max)val -= max;
	return val;
}

// Sort sortMe by using compare as the comparison function
function insertionSort(sortMe, compare)
{
	var i,j,tmp;
	for (i=0; i<sortMe.length; i++) {
		tmp = sortMe[i];
		for (j=i-1; j>=0 && compare(tmp, sortMe[j]); j--) {
			sortMe[j+1]=sortMe[j];
		}
		sortMe[j+1]=tmp;
	}
}

// Don't Worry, I come from the Amazing world of C++
// This function does a binary search (O(log n)) on a sorted array and returns
// index of first element that when called as a parameter of func is higher
// than threshold
function lower_bound(arr, min, max, threshold, func)
{
	while(true)
	{
		var w = max-min;
		var midpoint = min+Math.floor(w/2);

		if(w <= 0)
			return -1;
		if(w == 1)
		{
			if(func(arr[min]) > threshold)
				return min;
			return -1;
		}
		if(w == 2)
		{
			if(func(arr[min]) > threshold)
				return min;
			if(func(arr[min+1]) > threshold)
				return min+1;
			return -1;
		}
		if(func(arr[midpoint]) <= threshold)
		{
			min = midpoint+1;
		}
		else
		{
			max = midpoint+1;
		}
		continue;
	}
}

// Transform world coordinates to screen coordinates
function World2Screen(x,y,z)
{
	return {
		x: (x-y)*16,
		y: (x+y-2*z)*8
	};
}

function Cuboid2Screen(x,y,z,bx,by,bz)
{
	//bx = Math.ceil(bx);
	//by = Math.ceil(by);
	//bz = Math.ceil(bz);
	var front = ((x+bx/2)+(y+by/2)-2*(z-bz/2))*8;
	var left = ((x-bx/2)-(y+by/2))*16;
	var right = ((x+bx/2)-(y-by/2))*16;
	var top = ((x-bx/2)+(y-by/2)-2*(z+bz/2))*8;
	return {
		x: left+16,
		y: top+16,
		w: right-left,
		h: front-top
	};
}

function Screen2WorldXY(x,y,z)
{
	// Project (x,y) to a XY-plane in world with height Z
	
	var obj = {
		x: Math.round((x+y-x/2)/16)-1,
		y: Math.round(((y-x/2))/16)
	};
	
	obj.x += z;
	obj.y += z;
	
	return obj;
}

// Rotate given vector around Z axis N degrees
function RotateVectorZ(vector, degrees)
{
	// To avoid rounding errors in common cases, we handle them separately:
	if(degrees == 90 || degrees == -270)
	{
		var v = vector[0];
		vector[0] = -vector[1];
		vector[1] = v;
		return;
	}
	else if(degrees == 180 || degrees == -180)
	{
		vector[0] = -vector[0];
		vector[1] = -vector[1];
		return;
	}
	else if(degrees == 270 || degrees == -90)
	{
		var v = vector[0];
		vector[0] = vector[1];
		vector[1] = -v;
		return;
	}
	if(degrees == 0 || degrees == 360 || degrees == -360) return;

	var len = Math.sqrt(vector[0]*vector[0]+vector[1]*vector[1]);
	var dir = Math.atan2(vector[1],vector[0]);
	
	dir += degrees / 180.0 * Math.PI;
	
	vector[0] = len * Math.cos(dir);
	vector[1] = len * Math.sin(dir);
}

if(!window.console)window.console = {};
if(!window.console.log)window.console.log = function(){};
if(!window.console.time)window.console.time = function(){};
if(!window.console.timeEnd)window.console.timeEnd = function(){};

function deepCopy (dupeObj)
{
	var retObj = new Object();
	if (typeof(dupeObj) == 'object')
	{
		if (typeof(dupeObj.length) != 'undefined')
			var retObj = new Array();
		for (var objInd in dupeObj)
		{	
			if (typeof(dupeObj[objInd]) == 'object') {
				retObj[objInd] = deepObjCopy(dupeObj[objInd]);
			} else if (typeof(dupeObj[objInd]) == 'string') {
				retObj[objInd] = dupeObj[objInd];
			} else if (typeof(dupeObj[objInd]) == 'number') {
				retObj[objInd] = dupeObj[objInd];
			} else if (typeof(dupeObj[objInd]) == 'boolean') {
				((dupeObj[objInd] == true) ? retObj[objInd] = true : retObj[objInd] = false);
			}
		}
	}
	return retObj;
}

/*
	Array.indexOf is not present in IE.
	After this code has run, it is.
	Source: MDC
*/

if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(searchElement /*, fromIndex */)
  {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (len === 0)
      return -1;

    var n = 0;
    if (arguments.length > 0)
    {
      n = Number(arguments[1]);
      if (n !== n) // shortcut for verifying if it's NaN
        n = 0;
      else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0))
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }

    if (n >= len)
      return -1;

    var k = n >= 0
          ? n
          : Math.max(len - Math.abs(n), 0);

    for (; k < len; k++)
    {
      if (k in t && t[k] === searchElement)
        return k;
    }
    return -1;
  };
}


// This function will detect browser flavor and version
navigator.browserData = (function(){
  var N= navigator.appName, ua= navigator.userAgent, tem;
  var M= ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
  if(M && (tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];
  M= M? [M[1], M[2]]: [N, navigator.appVersion,'-?'];
  return {name: M[0], version: M[1]};
 })();

function setCookie(c_name,value,exdays)
{
 var exdate=new Date();
 exdate.setDate(exdate.getDate() + exdays);
 var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
 document.cookie=c_name + "=" + c_value;
}


function getCookie(c_name)
{
 var i,x,y,ARRcookies=document.cookie.split(";");
 for (i=0;i<ARRcookies.length;i++)
 {
    x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
	y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
	x=x.replace(/^\s+|\s+$/g,"");
	if (x==c_name)
	{
	    return unescape(y);
	}
 }
}

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

$.extend({
  getUrlVars: function(){
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
      hash = hashes[i].split('=');
      if(typeof(hash[1]) == 'undefined')
      	hash[1] = null;
      vars.push(hash[0]);
      vars[hash[0]] = hash[1];
    }
    return vars;
  },
  getUrlVar: function(name){
    return $.getUrlVars()[name];
  }
});

$.extend({
	postJSON: function(a, b, c){
		return $.post(a, b, c, 'json');
	}
});

/**
*
*  Secure Hash Algorithm (SHA1)
*  http://www.webtoolkit.info/
*
**/
 
function SHA1 (msg) {
 
	function rotate_left(n,s) {
		var t4 = ( n<<s ) | (n>>>(32-s));
		return t4;
	};
 
	function lsb_hex(val) {
		var str="";
		var i;
		var vh;
		var vl;
 
		for( i=0; i<=6; i+=2 ) {
			vh = (val>>>(i*4+4))&0x0f;
			vl = (val>>>(i*4))&0x0f;
			str += vh.toString(16) + vl.toString(16);
		}
		return str;
	};
 
	function cvt_hex(val) {
		var str="";
		var i;
		var v;
 
		for( i=7; i>=0; i-- ) {
			v = (val>>>(i*4))&0x0f;
			str += v.toString(16);
		}
		return str;
	};
 
 
	function Utf8Encode(string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
 
		for (var n = 0; n < string.length; n++) {
 
			var c = string.charCodeAt(n);
 
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
 
		}
 
		return utftext;
	};
 
	var blockstart;
	var i, j;
	var W = new Array(80);
	var H0 = 0x67452301;
	var H1 = 0xEFCDAB89;
	var H2 = 0x98BADCFE;
	var H3 = 0x10325476;
	var H4 = 0xC3D2E1F0;
	var A, B, C, D, E;
	var temp;
 
	msg = Utf8Encode(msg);
 
	var msg_len = msg.length;
 
	var word_array = new Array();
	for( i=0; i<msg_len-3; i+=4 ) {
		j = msg.charCodeAt(i)<<24 | msg.charCodeAt(i+1)<<16 |
		msg.charCodeAt(i+2)<<8 | msg.charCodeAt(i+3);
		word_array.push( j );
	}
 
	switch( msg_len % 4 ) {
		case 0:
			i = 0x080000000;
		break;
		case 1:
			i = msg.charCodeAt(msg_len-1)<<24 | 0x0800000;
		break;
 
		case 2:
			i = msg.charCodeAt(msg_len-2)<<24 | msg.charCodeAt(msg_len-1)<<16 | 0x08000;
		break;
 
		case 3:
			i = msg.charCodeAt(msg_len-3)<<24 | msg.charCodeAt(msg_len-2)<<16 | msg.charCodeAt(msg_len-1)<<8	| 0x80;
		break;
	}
 
	word_array.push( i );
 
	while( (word_array.length % 16) != 14 ) word_array.push( 0 );
 
	word_array.push( msg_len>>>29 );
	word_array.push( (msg_len<<3)&0x0ffffffff );
 
 
	for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {
 
		for( i=0; i<16; i++ ) W[i] = word_array[blockstart+i];
		for( i=16; i<=79; i++ ) W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);
 
		A = H0;
		B = H1;
		C = H2;
		D = H3;
		E = H4;
 
		for( i= 0; i<=19; i++ ) {
			temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
			E = D;
			D = C;
			C = rotate_left(B,30);
			B = A;
			A = temp;
		}
 
		for( i=20; i<=39; i++ ) {
			temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
			E = D;
			D = C;
			C = rotate_left(B,30);
			B = A;
			A = temp;
		}
 
		for( i=40; i<=59; i++ ) {
			temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
			E = D;
			D = C;
			C = rotate_left(B,30);
			B = A;
			A = temp;
		}
 
		for( i=60; i<=79; i++ ) {
			temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
			E = D;
			D = C;
			C = rotate_left(B,30);
			B = A;
			A = temp;
		}
 
		H0 = (H0 + A) & 0x0ffffffff;
		H1 = (H1 + B) & 0x0ffffffff;
		H2 = (H2 + C) & 0x0ffffffff;
		H3 = (H3 + D) & 0x0ffffffff;
		H4 = (H4 + E) & 0x0ffffffff;
 
	}
 
	var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
 
	return temp.toLowerCase();
 
}


(function() {
	var units = ['millisecond', 'second', 'minute', 'hour', 'day', 'month', 'year'];
	var ratios = [1, 1000, 60, 60, 24, 30, 12];
	window.relative_time = function(date) {
		var delta = new Date() - date;
		if (delta <= 1000) {
			return 'Just now';
		}

		var unit = null;
		for (var i = 0; i < units.length; ++i) {
			if (delta < ratios[i]) {
				break;
			}
			unit = units[i];
			delta /= ratios[i];
		}

		delta = Math.floor(delta);
		if (delta !== 1) {
			unit += "s";
		}
		return [delta, unit, "ago"].join(" ");
	};
})();


$.fn.dataTableExt.oApi.fnReloadAjax = function ( oSettings, sNewSource, fnCallback, bStandingRedraw ){
	if ( typeof sNewSource != 'undefined' && sNewSource != null )
	{
		oSettings.sAjaxSource = sNewSource;
	}
	this.oApi._fnProcessingDisplay( oSettings, true );
	var that = this;
	var iStart = oSettings._iDisplayStart;
	
	var dataProp = oSettings.sAjaxDataProp || 'aaData';
	oSettings.fnServerData( oSettings.sAjaxSource, [], function(json) {
		/* Clear the old information from the table */
		that.oApi._fnClearTable( oSettings );
		
		/* Got the data - add it to the table */
		for ( var i=0 ; i<json[dataProp].length ; i++ )
		{
			that.oApi._fnAddData( oSettings, json[dataProp][i] );
		}
		
		oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();
		that.fnDraw();
		
		if ( typeof bStandingRedraw != 'undefined' && bStandingRedraw === true )
		{
			oSettings._iDisplayStart = iStart;
			that.fnDraw( false );
		}
		
		that.oApi._fnProcessingDisplay( oSettings, false );
		
		/* Callback user function - for event handlers etc */
		if ( typeof fnCallback == 'function' && fnCallback != null )
		{
			fnCallback( oSettings );
		}
	}, oSettings );
};
