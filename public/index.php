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
		?>
	</head>
	<body onload="reset()">
		<canvas id="canvas" width="640" height="480">
			You browser doesn't support the new HTML5 &lt;canvas&gt; element. <a href="http://getfirefox.org/">Try getting a real browser from Mozilla: http://getfirefox.org/</a>
		</canvas>
		<select name="Level selection" id="lselect" size="4" onchange="reset()">
			<option value="testlevel.js" selected="true">Testlevel</option>
			<option value="maze.js">Maze</option>
		</select>
		<input type="button" onclick="reset()" value="Reset"/>
	</body>
</html>
