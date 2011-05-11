/*
 * HTML5 Audio engine by Errietta Kostala
 */

var Audio = new Object();
Audio.create =
function (file, preload) {
	console.log (file, preload);
	var audio = document.createElement ("audio");
	audio.src = file;
	if (preload)
		audio.preload = "preload";
	audio.controls = "controls";
	audio.style.visibility = 'hidden';
	audio.style.height = "0px";
	audio.style.width = "0px";
	document.body.appendChild (audio);
	return audio;
}
Audio.preload =
function (file) {
	var audio = Audio.create (file, true);
	return audio;
}

Audio.play =
function (file, volume) {
	var audio = Audio.create (file, false);
	if (volume < 0 || volume > 1) {
		console.log ("Audio.play: Error: Volume can't be below 0 or above 1");
		return false;
	}
	audio.setAttribute ("onended","this.parentNode.removeChild(this);");
	audio.play();
	audio.volume = volume;
	audio.initialVol = volume;
	return audio;
}
Audio.setVolume =
function (element,volume) {
	if (volume < 0 || volume > 1) {
		console.log ("Audio.setVolume: Error: Volume can't be below 0 or above 1");
		return false;
	}
	element.volume = volume;
}
Audio.setGVolume =
function (multiplier) {
	multiplier = Math.abs (multiplier);
	var elems = document.getElementsByTagName ("audio");
	for (var i = 0; i < elems.length; i++) {
		var newVol = elems[i].initialVol * multiplier;
		elems[i].volume = newVol;
	}
}
		

Audio.stop =
function (element) {
	element.parentNode.removeChild (element);
}
document.bgmusic;
Audio.loadBG =
function (file) {
	if (document.bgmusic)
		console.log (document.bgmusic, document.bgmusic.playing);
	if (document.bgmusic && document.bgmusic.playing)
		return false;
	var audio = Audio.create (file, (document.bgmusic?false:true));
	document.bgmusic = audio;
	audio.setAttribute ("oncanplaythrough","Audio.playBG()");
}
Audio.playBG = 
function () {
	var audio = document.bgmusic;
	audio.play();
	audio.playing = true;
	audio.setAttribute ("onended","document.bgmusic.playing=false;this.parentNode.removeChild(this);");
}
Audio.stopBG = function() { 
	document.bgmusic.playing = false;
	Audio.stop (document.bgmusic);
}
