

function draw(obj, x, y, tilex, tiley)
{
	if(x+32<0||y+32<0||x-32>640||y-32>480)return;
	// Examine input object
	if(typeof(obj) != 'object')
		return;

	Graphics.ctx.drawImage(
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

