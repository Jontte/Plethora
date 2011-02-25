<?php
	require('jsmin.php');

	// Configurables
	$source_directory = '/home/joonas/plethora/';
	$levels =	
		array(
			'Testlevel'	=> array('basepkg.js', 'testlevel.js'),
			'Maze'		=> array('basepkg.js', 'maze.js'),
			'Puzzle' 	=> array('basepkg.js', 'puzzle.js')
		);


	$minify = true;

	$selection = $_GET['level'];

	if(isset($selection))
	{
		header('Content-type: text/javascript');
		
		if(array_key_exists($selection, $levels))
		{
			$files = $levels[$selection];
			foreach($files as $file)
			{
				$src = file_get_contents($source_directory.'levels/'.$file);
				
				if($minify == true)
					echo JSMin::minify($src);
				else
					echo $src;
			}
		}
		die();
	}
?><!DOCTYPE html>
<html>
	<head>
		<title>Plethora</title>

		<?php
			$files = array('util.js', 'tree.js', 'key.js', 'world.js', 'main.js');
			{
				$selection = $levels[0];
			}
			
			echo '<script type="text/javascript">';
			foreach($files as $file)
			{
				$src = file_get_contents($source_directory.$file);
				if($minify == true)
					echo JSMin::minify($src);
				else
					echo $src;
			}
			echo '</script>';
?>		<style>
			#background {
				background-color: #1a82f7;
				background: -moz-linear-gradient(100% 100% 90deg, #2F2727, #1a82f7);
				background: -webkit-gradient(linear, 0% 0%, 0% 100%, from(#1a82f7), to(#2F2727));
			}
			#game {
				border: 1px black solid;
				width: 640px;
				height: 480px;
				float: left;
			}
			#panel {
				border: 1px black dashed;
				width: 200px;
				height: 480px;
				float: left;
				text-align: center;
			}
			#container {
				width: 844px;	
				height: 480px;
			}
			.menuitem {
				width: 198px;
				background-color: #FF9600;
				border: 1px black solid;
				padding-top: 10px;
				padding-bottom: 10px;
			}
			.menuitem:hover {
				background-color: #FFBB00;
			}
			.popup {
				background-color: #DDBBCC;
				padding: 10px;
				border: 1px black solid;
				visibility: hidden;
				width: 300px;
				z-index: 1;
			}
			#about-text {
				position:absolute; left:180; top:25;
				width: 400px;
			}
			#tech-text {
				position:absolute; left:180; top:25;
				width: 400px;
			}
			#author-text {
				position:absolute; left:180; top:25;
			}
		</style>
			<script type="text/javascript">
				function show_message(which)
				{
					var windows = ['about','tech','author'];
					for(var i = 0; i < windows.length; i++)
					{
						var elem = document.getElementById(windows[i]+'-text');
						if(which == windows[i])
						{
							// Toggle
							elem.style.visibility=(elem.style.visibility!='visible')?'visible':'hidden';
						}
						else
							elem.style.visibility='hidden';
					}
				}	
			</script>
			<?php 
				/* Include Google Analytics tracker code */
				if(file_exists('ga_tracker.php')){echo file_get_contents('ga_tracker.php');}
			?>
	</head>
	<body onload="reset()" id="background">
		<div id="container">
			<div id="about-text" class="popup" onclick="show_message()">
				<h2>About</h2><hr>
				<p>
					Plethora is an isometric game engine written in pure Javascript. It utilizes the new HTML5 &lt;canvas&gt; tag that allows for pixel-perfect (and potentially hardware accelerated) drawing in the browser. 
				</p>
				<p>
					It was written as a proof of concept: With today's web browser JavaScript performance it is possible to perform simple dynamics simulation and collision detection. 
				</p>
				<p>
					But only barely as of February 2011. Only Google Chrome achieves reasonable frame rates while the latest Firefox crawls behind. Admittedly there is still much to optimize, but I'm comfident I'm soon reaching the limits of JS power. 
				</p>
				<p>
					A couple of people have asked whether I'm releasing the source code as an open source JS library. Sure, but not before I've cleaned and documented the codebase. 
				</p>
			</div>
			<div id="tech-text" class="popup" onclick="show_message()">
				<h2>Tech</h2><hr>
				<p>
					In the future I hope to reduce performance requirements even further by:
					<ul>
						<li>Not redrawing every single block again and again every frame. Draw fixed objects to an offscreen canvas once and re-use it as much as possible.</li>
						<li>Have a closer look at the depth-ordering code.</li>
						<li>JS not being my major language I suspect there are some inefficient quirks left.</li>
					</ul>
					I have also thought about adding some online features such as a level editor and a way to publish, share and rate levels. Some intermediary language will be required however since I cannot allow people to run arbitrary Javascript code on other peoples' browsers.
				</p>
				<p>
					No, real-time MMO-like gameplay with your friends is not possible with at least traditional web techniques.
				</p>
			</div>
			<div id="author-text" class="popup" onclick="show_message()">
				<h2>Author</h2><hr>
				<p>
					Plethora was written by Joonas Haapala. His website is located <a href="http://sipuli.net/joonas/">here</a>.
				</p>
				<p>
					He is no graphics artist, nor does he find general web design (HTML&amp;CSS) particularly enjoyable, so if you feel like contributing, please contact him at his email joonas[meow]haapa.la. Wishes, ideas, comments, criticism welcome.
				</p>
			</div>
			<div id="panel">
				<h2>Plethora</h2>
				
				<a href="#" onclick="show_message('about')"><div class="menuitem">About</div></a>
				<a href="#" onclick="show_message('tech')"><div class="menuitem">Tech</div></a>
				<a href="#" onclick="show_message('author')"><div class="menuitem">Author</div></a>

				<select name="Level selection" id="lselect" size="4" onchange="reset()">
<?php
	$first = ' selected="true"';
	foreach($levels as $key => $value)
	{
		echo "<option value=\"$key\"$first>$key</option>\n";
		$first = '';
	}
?>
				</select>
				<input id="selector" type="button" onclick="reset()" value="Reset"/>
				<div style="height: 100px;">
				</div>
				<a href="http://www.google.com/chrome">
					<img src="worksbestwith.png" alt="Works best with Google Chrome"/>
				</a>
			</div>
			<div id="game">
				<canvas id="canvas" width="640" height="480">
					You browser doesn't support the new HTML5 &lt;canvas&gt; element. <a href="http://getfirefox.org/">Try getting a real browser from Google: http://www.google.com/chrome/</a>
				</canvas>
			</div>
		</div>
	</body>
</html>
