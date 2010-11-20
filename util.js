

function draw(obj, x, y, frame)
{
	if(!frame)frame = 0;

	// Examine input object
	if(typeof(obj) != 'object')
		return;

	var coords = [0, 0];
	
	if(typeof(obj[0]) != 'object')
	{
		// Single pair of coordinates, okay.
		coords[0] = obj[0];
		coords[1] = obj[1];
	}
	else if(typeof(obj[0][0]) != 'object')
	{
		// 1-D array of coordinates, okay.
		frame = frame % obj.length;
		coords[0] = obj[frame][0];
		coords[1] = obj[frame][1];
	}
	else if(typeof(obj[0][0][0]) != 'object')
	{
		// 2-D array of coordinates, okay.
		frame[0] = frame[0] % obj.length;
		frame[1] = frame[1] % obj[frame[0]].length;
		coords[0] = obj[frame[0]][frame[1]][0];
		coords[1] = obj[frame[0]][frame[1]][1];
	}

	Graphics.ctx.drawImage(
		Graphics.tileset, 
		32*coords[0], 32*coords[1],	
		32, 32,
		x, y,
		32, 32
	);
}

function debug(text)
{
	var elem = document.getElementById('debug');
	elem.innerHTML += text + "<br>\n";
}
