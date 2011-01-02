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
?><html>
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
				height: 100px;
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
			}
			#author-text {
				position:absolute; left:180; top:25;
			}
		</style>
			<script type="text/javascript">
				function show_message(which)
				{
					var windows = ['about','author'];
					for(var i = 0; i < windows.length; i++)
					{
						if(which == windows[i])
							document.getElementById(windows[i]+'-text').style.visibility='visible';
						else
							document.getElementById(windows[i]+'-text').style.visibility='hidden';
					}
				}	
			</script>
			<?php if(file_exists('ga_tracker.php')){echo file_get_contents('ga_tracker.php');} ?>
	</head>
	<body onload="reset()" id="background">
		<div id="container">
			<div id="about-text" class="popup" onclick="show_message()">
				<h2>About</h2><hr>
				<p>
					Plethora is an isometric game engine written in pure Javascript. It utilizes the new HTML5 &lt;canvas&gt; tag that allows for pixel-perfect (potentially hardware accelerated) drawing in the browser. 
				</p>
			</div>
			<div id="author-text" class="popup" onclick="show_message()">
				<h2>Author</h2><hr>
				<p>
					Plethora was written by Joonas Haapala. See his website <a href="http://sipuli.net/joonas/">here</a>.
				</p>
				<p>
					I am no graphics artist, nor do I find general web design (HTML&amp;CSS) particularly enjoyable, so if you feel like contributing, please contact me at my email joonas[meow]haapa.la.
				</p>
			</div>
			<div id="panel">
				<h2>Plethora</h2>
				
				<a href="#" onclick="show_message('about')"><div class="menuitem">About</div></a>
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
				<div style="height: 200px;">
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
