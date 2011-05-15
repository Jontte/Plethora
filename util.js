

function sign(x)
{
	if(x>0)return 1;
	else if(x<0)return -1;
	return 0;
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
	
//	x-=16;
//	y-=16;
	return {
		x: Math.round((x+y-x/2)/16)+z-1,
		y: Math.round(((y-x/2))/16)+z
	};
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


