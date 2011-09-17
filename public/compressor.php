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
	// Get file from cache if no changes were made since last time
	$cacheChanged = @filemtime($file['cacheFile']);
	$fileChanged = @filemtime($file['path']);
	if ( $cacheChanged !== false && $fileChanged !== false && $cacheChanged >= $fileChanged ){
		readfile($file['cacheFile']);
		continue;
	}
	
	$source = file_get_contents($file['path']);
	$path = dirname($file['path']);
	
	$headers = array();
	
	if ( !$file['compress'] ){
		$headers []= 'File not compressed due to configuration';
	}
	else{
		switch ( $group['type'] ){
			case 'javascript':
				try{
					$source = JShrink::minify($source, array('flaggedComments' => false));
				}
				catch(Exception $ex){
					$headers []= 'Error during compression, file not compressed!';
					@ob_flush();
					ob_start();
					var_dump($ex->getMessage());
					$headers []= rtrim(ob_get_contents(), "\r\n");
					ob_end_clean();
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
	
	// Add file metadata as comments
	array_unshift($headers, $file['name'], date('r'));
	$source = '/* ' . implode(" */\n/* ", $headers) . " */\n\n" . trim($source, "\r\n\t ") . "\n\n";
	echo $source;
	
	file_put_contents($file['cacheFile'], $source);
}
