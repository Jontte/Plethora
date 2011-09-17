<?php

require_once('compressor_config.php');

// Allow pass through to enable inclusion of files outside wwwroot
if ( !empty($_GET['passthru']) ){
	foreach ( $compressorGroups as &$group ){
		foreach ( $group['files'] as &$file ){
			if ( $file['path'] == $_GET['passthru'] ){
				header('Content-Type: text/'.$group['type']);
				readfile($_GET['passthru']);
				exit(0);
			}
		}
	}
	die('File disallowed');
}

// Don't continue if no group is given
if ( empty($_GET['group']) || empty($compressorGroups[$_GET['group']]) )
	die('Invalid group');

// Extract group information and set headers
$group = $compressorGroups[$_GET['group']];
unset($compressorGroups);
header('Content-Type: text/'.$group['type']);

if ( $group['type'] == 'javascript' )
	require_once('JShrink-0.2.class.php');

// Go through files and compress the source
foreach ( $group['files'] as &$file ){
	$source = file_get_contents($file['path']);
	$path = dirname($file['path']);
	
	if ( !$file['compress'] ){
		$source = "/* File not compressed due to configuration */\n" . $source;
	}
	else{
		switch ( $group['type'] ){
			case 'javascript':
				try{
					$source = JShrink::minify($source, array('flaggedComments' => false));
				}
				catch(JShrinkException $ex){
					$source = "/* Error during compression, file not compressed! */\n" . $source;
				}
			break;
			case 'css':
				// Update relative paths
				if ( $path != '.' )
					$source = preg_replace('#url\\((["\'])?([^"\'\\)]+)["\']?\\)#i', 'url($1'.$path.'/$2$3)', $source);

				$source = str_replace(array("\r", "\n"), '', $source); // remove newlines
				$source = preg_replace('#/\\*.*?\\*/|\\s*([{};,])\\s*|(:)\\s+#', '$1$2', $source); // remove comments, and whitespace around { } ; , and after :
				$source = str_replace('}', "}\n", $source); // add newlines after blocks
			break;
		}
	}
	
	echo '/* ', $file['name'], " */\n", $source, "\n\n";
}
