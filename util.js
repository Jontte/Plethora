

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
		x, y,
		32, 32
	);
}

function debug(text)
{
	var elem = document.getElementById('debug');
	elem.innerHTML += text + "<br>\n";
}
