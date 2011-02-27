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
				if(isset($_COOKIE['level_selection']))
					$selection = $_COOKIE['level_selection'];
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
			#todo-text {
				position:absolute; left:180; top:25;
				width: 400px;
			}
			#author-text {
				position:absolute; left:180; top:25;
			}
			#browser-warning {
				visibility: hidden;
				background-color: #60A0FF;
				border: 1px black solid;
				position: absolute;
				width: 598px;
				height: 438px;
				padding: 20px 20px 20px 20px;
			}
		</style>
			<!-- Crude canvas support for IE family browsers. Many thanks to Google.-->
			<!--[if IE]><script type="text/javascript" src="excanvas.js"></script><![endif]-->
			<script type="text/javascript">
				function show_message(which)
				{
					var windows = ['about','tech','todo','author'];
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
					But only barely as of 2011. Only Google Chrome achieves reasonable frame rates while even the latest Firefox crawls behind. Admittedly there is still much to optimize on my side, but I'm comfident I'm soon reaching the limits of what JS can do. 
				</p>
				<p>
					A couple of people have asked whether I'm releasing the source code as an open source JS library. Sure, but not before I've cleaned and documented the codebase. 
				</p>
			</div>
			<div id="tech-text" class="popup" onclick="show_message()">
				<h2>Tech</h2><hr>
				<p>
					In the future I hope to improve performance even further by:
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
			<div id="todo-text" class="popup" onclick="show_message()">
				<h2>TODO</h2><hr>
				<p>
					Plethora is still far from being a full game. Below is a list of important tasks/objectives waiting for me.
					<ul>
						<li>More graphics: Character animation, logo, landscapes, everything. Maybe You can help?</li>
						<li>A safe level format that allows for basic scripting</li>
						<li>A level editor</li>
						<li>A level sharing system</li>
						<li>Wider browser support</li>
						<li>More collision shapes for the physics engine. Spheres, Ellipsoids, Tilted surfaces, ...</li>
						<li>Sound effects and background music?</li>
					</ul>
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
				<a href="#" onclick="show_message('todo')"><div class="menuitem">Todo</div></a>
				<a href="#" onclick="show_message('author')"><div class="menuitem">Author</div></a>

				<select name="Level selection" id="lselect" size="4" onchange="reset()">
<?php
	foreach($levels as $key => $value)
	{
		$msg = $key==$selection?' selected="true"':'';
		echo "<option value=\"$key\"$msg>$key</option>\n";
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
				<div id='browser-warning'>
					<h2>Suboptimal browser detected</h2>
					Plethora is likely to perform very poorly on your web browser. This may result into crashes and instability in your system. Are you sure you want to continue? <input type="submit" value="Yes!" onclick="reset('yes')"/><input type="submit" value="No!" onclick="document.location = 'http://www.google.com/chrome/';"/>
					<div><img src="plethora.jpg"/></div>
				</div>
				<canvas id="canvas" width="640" height="480">
					<p><h2>You browser doesn't support the new HTML5 &lt;canvas&gt; element.</h2></p><p>Try getting a real browser from Google: <b><a href="http://www.google.com/chrome/">http://www.google.com/chrome/</a></b></p>
				</canvas>
			</div>
		</div>
	</body>
</html>
