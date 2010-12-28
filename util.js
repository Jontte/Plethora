

function draw(obj, x, y, tilex, tiley, ctx)
{
	// If no canvas context was specified, use the main canvas
	if(!ctx)ctx = Graphics.ctx;
	
	if(x+32<0||y+32<0||x-32>640||y-32>480)return;
	
	ctx.drawImage(
		Graphics.tileset, 
		32*tilex, 32*tiley,	
		32, 32,
		Math.floor(x), Math.floor(y),
		32, 32
	);
}


// Sort sortMe by using compare as the comparison function
function insertionSort(sortMe, compare)
{
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
		if(w == 0)
			return min;
		var midpoint = min+Math.floor(w/2);

		if(func(arr[midpoint]) <= threshold)
		{
			if(min == midpoint) {
				min++; // This might happen due to rounding
			}
			else {
				min = midpoint;
			}
			continue;
		}
		else
		{
			max = midpoint;
			continue;
		}
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

