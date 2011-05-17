<?php
	require('config.php');
	require('jsmin.php');

	$files = array('util.js', 'jsbih.js', 'key.js', 'effects.js', 'world.js', 'draw.js', 'editor.js', 'collision.js', 'audio.js', 'main.js', 'modules/PlethoraOriginal.js');
	
	$levels =	
		array(
			'Puzzle' 	=> 'puzzle.lev'
		);

	if(isset($_GET['level']))
	{
		$selection = $_GET['level'];
		header('Content-type: text/json');
		
		if(array_key_exists($selection, $levels))
		{
			$file = $levels[$selection];
			die(file_get_contents($source_directory.'levels/'.$file));
		}
		die();
	}
	else if(isset($_GET['get']) && $minify === false)
	{
		header('Content-type: application/x-javascript');
		$file = $_GET['get'];
		if(in_array($file, $files))
		{
			die(file_get_contents($source_directory.$file));
		}
		die();
	}
?><!DOCTYPE html>
<html>
	<head>
		<title>Plethora</title>
		<link type="text/css" href="redmond/jquery-ui-1.8.12.custom.css" rel="stylesheet" />	
		
		<!-- Crude canvas support for IE family browsers. Many thanks to Google.-->
		<!--[if IE]><script type="text/javascript" src="excanvas.js"></script><![endif]-->
		<script type="text/javascript" src="json_parse.js"></script>
		<script type="text/javascript" src="jquery-1.5.1.min.js"></script>
		<script type="text/javascript" src="jquery-ui-1.8.12.custom.min.js"></script>
		<?php

			$selection = array_keys($levels);
			$selection = $selection[0];
				
			if(isset($_COOKIE['level_selection']))
			{
				$cookie = $_COOKIE['level_selection'];
			 	if(strlen($cookie)>2)
					$selection = $cookie;
			}

			
			if($minify === true)
			{
				echo '<script type="text/javascript">';
				foreach($files as $file)
				{
					echo JSMin::minify(file_get_contents($source_directory.$file));
				}
				echo '</script>';
			}
			else
			{
				foreach($files as $file)
				{
					echo '<script type="text/javascript" src="index.php?get='.$file.'"></script>'."\n";
				}
			}
?>		<style>
			body {
				background-color: #1a82f7;
			}
			#game {
				border: 1px black solid;
				width: 640px;
				height: 480px;
				float: left;
			}
			#panel {
				width: 200px;
				height: 480px;
				float: left;
				text-align: center;
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
			<?php 
				/* Include Google Analytics tracker code */
				if(file_exists('ga_tracker.php')){echo file_get_contents('ga_tracker.php');}
			?>
	</head>
	<body>
		<div id="about-text" title="About">
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
		<div id="tech-text" title="Technology">
			<h2>Tech</h2><hr>
			<p>
				In the future I hope to improve performance even further by:
			</p>
			<ul>
				<li>Not redrawing every single block again and again every frame. Draw fixed objects to an offscreen canvas once and re-use it as much as possible.</li>
				<li>Have a closer look at the depth-ordering code.</li>
				<li>JS not being my major language I suspect there are some inefficient quirks left.</li>
			</ul>
			<p>
				I have also thought about adding some online features such as a level editor and a way to publish, share and rate levels. Some intermediary language will be required however since I cannot allow people to run arbitrary Javascript code on other peoples' browsers.
			</p>
			<p>
				No, real-time MMO-like gameplay with your friends is not possible with at least traditional web techniques.
			</p>
		</div>
		<div id="todo-text" title="TODO-list">
			<h2>TODO</h2><hr>
			<p>
				Plethora is still far from being a full game. Below is a list of important tasks/objectives waiting for me.
			</p>
			<ul>
				<li>More graphics: Character animation, logo, landscapes, everything. Maybe You can help?</li>
				<li>A safe level format that allows for basic scripting</li>
				<li>A level editor</li>
				<li>A level sharing system</li>
				<li>Wider browser support</li>
				<li>More collision shapes for the physics engine. Spheres, Ellipsoids, Tilted surfaces, ...</li>
				<li>Sound effects and background music?</li>
			</ul>
		</div>
		<div id="author-text" title="Author">
			<h2>Author</h2><hr>
			<p>
				Plethora was written by Joonas Haapala. His website is located <a href="http://sipuli.net/joonas/">here</a>.
			</p>
			<p>
				He is no graphics artist, nor does he find general web design (HTML&amp;CSS) particularly enjoyable, so if you feel like contributing, please contact him at his email joonas[meow]haapa.la. Wishes, ideas, comments, criticism welcome.
			</p>
		</div>
		<div id="panel" class="ui-corner-all ui-widget">
			<div class="ui-corner-all ui-widget-header"><h2>Plethora</h2></div>
			<div class="ui-corner-all ui-widget-content">
				<input type="button" id="about-button" value="About"/>
				<input type="button" id="tech-button" value="Tech"/>
				<input type="button" id="todo-button" value="Todo"/>
				<input type="button" id="author-button" value="Author"/>
	
				<hr/>
				<select name="Level selection" id="lselect" size="4" onchange="reset()">
<?php
foreach($levels as $key => $value)
{
	$msg = ($key==$selection)?' selected="true"':'';
	echo "<option value=\"$key\"$msg>$key</option>\n";
}
?>
				</select>
				
				<input id="resetbutton" type="button" value="Reset"/>
			
				<div id="sw-radio">
					<input type="radio" id="sw-radio-play" name="radio" checked="checked" /><label for="sw-radio-play">Play</label>
					<input type="radio" id="sw-radio-edit" name="radio" /><label for="sw-radio-edit">Edit</label>
				</div>
				<div style="height: 80px;"></div>
				<a href="http://www.google.com/chrome">
					<img src="worksbestwith.png" alt="Works best with Google Chrome"/>
				</a>
			</div>
		</div>
		<div id="game">
			<div id="browser-warning">
				<h2>Suboptimal browser detected</h2>
				<p>Plethora is likely to perform very poorly on your web browser. This may result into crashes and instability in your system. Are you sure you want to continue?</p>
				<input type="submit" value="Yes!" onclick="reset('yes')"/>
				<input type="submit" value="No!" onclick="document.location = 'http://www.google.com/chrome/';"/>
				<div><img src="plethora.jpg"/></div>
			</div>
			<canvas id="canvas" width="640" height="480">
				<h2>You browser doesn't support the new HTML5 &lt;canvas&gt; element.</h2>
				<p>
					Try getting a real browser from Google: 
					<b><a href="http://www.google.com/chrome/">http://www.google.com/chrome/</a></b>
				</p>
			</canvas>
		</div>
	</body>
</html>
