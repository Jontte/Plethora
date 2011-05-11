

function draw(x, y, tilex, tiley, source, dest)
{
	// If no canvas context was specified, use the main canvas
	if(!dest)dest = Graphics.ctx;
	if(x+32<0||y+32<0||x-32>640||y-32>480)return;
	
	dest.drawImage(
		source, 
		32*tilex, 32*tiley,	
		32, 32,
		Math.floor(x), Math.floor(y),
		32, 32
	);
}

function progressbar(current, max, message)
{
	var w = 640;
	var h = 480;

	var ctx = Graphics.ctx;

	ctx.fillStyle = 'black';
	ctx.globalAlpha = 0.2;
	ctx.fillRect (0, 0, 640, 480);		
	ctx.globalAlpha = 1.0;
	
	ctx.fillStyle = 'black';
	Graphics.ctx.fillRect(w/4,h/4,w/2,h/2);
	ctx.fillStyle = 'red';
	Graphics.ctx.fillRect(w/4+50,h/4+50,(w/2-100)*current/max,h/2-100);

	// Force redraw of canvas..
	document.getElementById('canvas').style.opacity = 1.0-0.001*Math.random();
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

