<?php
	require('jsmin.php');

	// Configurables
	$source_directory = '/home/joonas/plethora/';
	$levels = array('testlevel.js', 'maze.js');
	$minify = true;

	$selection = $_GET['level'];

	if(isset($selection))
	{
		header('Content-type: text/javascript');
		if(in_array($selection, $levels))
		{
			$src = file_get_contents($source_directory.'levels/'.$selection);
			if($minify == true)
				echo JSMin::minify($src);
			else
				echo $src;
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
				background: url(images/linear_bg_2.png);
				background: -moz-linear-gradient(100% 100% 90deg, #2F2727, #1a82f7);
				background: -webkit-gradient(linear, 0% 0%, 0% 100%, from(#1a82f7), to(#2F2727));
			}
			#border {
				border: 1px black solid;
				width: 640px;
				height: 480px;
			}
		</style>
	</head>
	<body onload="reset()" id="background">
		<div id="border" style="float: left">
			<canvas id="canvas" width="640" height="480">
				You browser doesn't support the new HTML5 &lt;canvas&gt; element. <a href="http://getfirefox.org/">Try getting a real browser from Mozilla: http://getfirefox.org/</a>
			</canvas>
		</div>
		<div style="float: left">
			<select name="Level selection" id="lselect" size="4" onchange="reset()">
				<option value="testlevel.js" selected="true">Testlevel</option>
				<option value="maze.js">Maze</option>
			</select>
			<input type="button" onclick="reset()" value="Reset"/>
			<br clear="left">
			<a href="http://www.google.com/chrome">
				<img src="worksbestwith.png" alt="Works best with Google Chrome"/>
			</a>
		</div>
	</body>
</html>
