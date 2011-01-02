

function draw(x, y, tilex, tiley, ctx)
{
	// If no canvas context was specified, use the main canvas
	if(!ctx)ctx = Graphics.ctx;
	
	if(x+32<0||y+32<0||x-32>640||y-32>480)return;
	
	ctx.drawImage(
		Graphics.img['tileset.png'], 
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
function World2Screen(p)
{
	return [
		(p[0]-p[1])*16,
		(p[0]+p[1]-2*p[2])*8
	];
}



