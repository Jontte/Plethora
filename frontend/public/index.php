<?php

require_once('../php/config.php');
require_once('../php/compressor_config.php');

?><!DOCTYPE html>
<html>
	<head>
		<title>Plethora</title>
		<link type="text/css" href="compressor.php?group=css" rel="stylesheet" />
		
		<link type="text/css" href="style.less" rel="stylesheet/less" />
		<script type="text/javascript" src="compressor.php?passthru=js%2Fthird_party%2Fless-1.1.3.min.js"></script>
		
		<!-- Crude canvas support for IE family browsers. Many thanks to Google.-->
		<!--[if IE]><script type="text/javascript" src="compressor.php?passthru=js%2Fthird_party%2Fexcanvas.js"></script><![endif]-->
		
		<script type="text/javascript">
			var recaptchaPublicKey = '<?php echo $plethora_recaptcha['public']; ?>';
		</script>
		
		<?php
		
		if ( $plethora_debug ){
			foreach ( $compressorGroups['js']['files'] as $file ){
				if ( !$file['ignore'] )
					echo '<script type="text/javascript" src="compressor.php?passthru=', urlencode($file['path']), '"></script>';
			}
		}
		else
			echo '<script type="text/javascript" src="compressor.php?group=js"></script>';
		
		?>
	</head>
	<body>
		<div id="wrapper"></div>
		<?php
		
		/* Include Google Analytics tracker code */
		if ( file_exists('ga_tracker.php') )
			include('ga_tracker.php');
		
		?>
	</body>
</html>
