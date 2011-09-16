<?php

require_once('config.php');

?><!DOCTYPE html>
<html>
	<head>
		<title>Plethora</title>
		<link type="text/css" href="min/?g=css" rel="stylesheet" />			
		<!-- Crude canvas support for IE family browsers. Many thanks to Google.-->
		<!--[if IE]><script type="text/javascript" src="excanvas.js"></script><![endif]-->
		
		<script type="text/javascript" src="http://www.google.com/recaptcha/api/js/recaptcha_ajax.js"></script>
		<script type="text/javascript">
			var recaptchaPublicKey = '<?php echo $plethora_recaptcha['public']; ?>';
		</script>
		
		<?php 
			if($plethora_debug)
			{
				$files = array(
					'public/json2.js',
					'public/jquery-1.6.3.min.js',
					'public/jquery-ui-1.8.12.custom.min.js',
					'public/jquery.toastmessage.js',
					'public/DataTables-1.8.2/jquery.dataTables.min.js',
					'public/jquery-mousewheel-3.0.4/jquery.mousewheel.min.js',
					'util.js',
					'jsbih.js',
					'key.js',
					'effects.js',
					'world.js',
					'draw.js',
					'editor.js',
					'collision.js',
					'audio.js',
					'main.js',
					'modules/PlethoraOriginal.js');
				foreach($files as $file)
				{
					echo "<script type=\"text/javascript\" src=\"min/?f=$file&debug=1\"></script>";
				}
			}
			else
			{
				?><script type="text/javascript" src="min/?g=js"></script><?php
			}

			/* Include Google Analytics tracker code */
			if(file_exists('ga_tracker.php')){include('ga_tracker.php');}
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
				Latest production version of Plethora can be found at <a href="http://github.com/Jontte/plethora">http://github.com/Jontte/plethora</a>. It is published under the three-clause BSD.
			</p>
		</div>
		<div id="tech-text" title="Technology">
			<h2>Tech</h2><hr>
			<p>
				Plethora utilizes a Bounding Interval Hierarchy for static object collision. An excellent implementation in Javascript can be found here: <a href="http://github.com/imbcmdth/jsBIH">http://github.com/imbcmdth/jsBIH</a>
			</p>
			<p>
				Real time (WebSockets-powered) multiplayer features are planned. 
			</p>
		</div>
		<div id="todo-text" title="TODO-list">
			<h2>TODO</h2><hr>
			<p>
				Plethora is still far from being a full game. Below is a list of important tasks/objectives:
			</p>
			<h3>Short term</h3>
			<ul>
				<li>More graphics: Character animation, logo, landscapes, everything. Maybe You can help?</li>
				<li>Sound effects and background music?</li>
			</ul>
			<h3>Long term</h3>
			<ul>
				<li>Multiplayer mode</li>
				<li>Different game modes</li>
			</ul>
		</div>
		<div id="author-text" title="Author">
			<h2>Author</h2><hr>
			<p>
				Plethora was written by Joonas Haapala. His website is located <a href="http://sipuli.net/joonas/">here</a>. Atte Virtanen gave a hand with the server side code.
			</p>
			<p>
				Joonas is no graphics artist, nor does he find general web design (HTML&amp;CSS) particularly interesting, so if you feel like contributing, please contact him at his email joonas[meow]haapa.la. Wishes, ideas, comments, criticism welcome.
			</p>
		</div>
		<div id="level-selector-panel">
			<table cellspacing="0" id="level-selector-grid"> 
				<thead> 
					<tr> 
						<th>ID</th> 
						<th>Updated</th> 
						<th>Name</th> 
						<th>Description</th> 
						<th>User_id</th> 
						<th>Username</th> 
					</tr> 
				</thead> 
				<tbody> 
		
				</tbody> 
				<tfoot> 
					<tr> 
						<th>ID</th> 
						<th>Updated</th> 
						<th>Name</th> 
						<th>Description</th> 
						<th>User_id</th> 
						<th>Username</th> 
					</tr> 
				</tfoot> 
			</table> 
		</div>
		<div id="login-panel" title="Login/Register">
			<div style="width:30%;float:left;">
				<p>Login</p>
				<p>
					<form id="login-form">
						<label for="login-username">Username:</label><br />
						<input id="login-username" name="login-username" type="text" /><br />
						<label for="login-password">Password:</label><br />
						<input id="login-password" name="login-password" type="password" /><br />
						<input type="submit" value="Login" />
					</form>
				</p>
			</div>
			<div style="width:65%;margin-left:35%;">
				<p>Register</p>
				<p>
					<form id="register-form">
						<label for="register-username">Username:</label><br />
						<input id="register-username" name="register-username" type="text" /><br />
						<label for="register-password">Password:</label><br />
						<input id="register-password" name="register-password" type="password" /><br />
						<label for="register-password-again">Password (again):</label><br />
						<input id="register-password-again" name="register-password-again" type="password" /><br />
						<div id="register-captcha"></div>
						<input type="submit" value="Register" />
					</form>
				</p>
			</div>
		</div>
		<div id="wrapper">
			<div id="panel" class="ui-corner-all ui-widget">
				<div class="ui-corner-tl ui-widget-header"><h2>Plethora</h2></div>
				<div id="panel-content" class="ui-corner-bl ui-widget-content">
					<div id="panel-top-buttons">
						<div id="about-button">About</div>
						<div id="tech-button">Tech</div>
						<div id="todo-button">Todo</div>
						<div id="author-button">Author</div>
					</div>
					
					<input type="button" id="level-selector" value="Level selector" />
					<input id="resetbutton" type="button" value="Reset" />

					<div id="sw-radio">
						<input type="radio" id="sw-radio-play" name="radio" checked="checked" />
						<label for="sw-radio-play">Play</label>
						<input type="radio" id="sw-radio-edit" name="radio" />
						<label for="sw-radio-edit">Edit</label>
					</div>
					<input id="save-btn" type="button" value="Save" />
					<hr />
					<input type="button" id="login-panel-button" value="Login/Register" />
					<input type="button" id="logout-button" value="Logout" />

					<div id="worksbestwith">
						<a href="http://www.google.com/chrome">
							<img src="worksbestwith.png" alt="Works best with Google Chrome" />
						</a>
					</div>
				</div>
			</div>
			<div id="game" class="ui-corner-right">
				<div id="browser-warning">
					<h2>Suboptimal browser detected</h2>
					<p>Plethora is likely to perform very poorly on your web browser. This may result into crashes and instability in your system. Are you sure you want to continue?</p>
					<input type="submit" value="Yes!" onclick="reset('yes')" />
					<input type="submit" value="No!" onclick="document.location = 'http://www.google.com/chrome/';" />
					<div><img src="plethora.jpg" /></div>
				</div>
				<canvas id="canvas" width="640" height="480" class="ui-corner-right">
					<h2>You browser doesn't support the new HTML5 &lt;canvas&gt; element.</h2>
					<p>
						Try getting a real browser from Google: 
						<b><a href="http://www.google.com/chrome/">http://www.google.com/chrome/</a></b>
					</p>
				</canvas>
				<div id="intro">
					<h2>Welcome to plethora</h2>
					<p>
						Open the level selector menu from the left to play.
					</p>
				</div>
				<div id="cache"></div>
			</div>
		</div>
	</body>
</html>
