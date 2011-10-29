<?php

require_once('../php/compressor_config.php');

$requestHeaders = function_exists('getallheaders') ? getallheaders() : null;

// Allow pass through to enable inclusion of files outside wwwroot
if ( !empty($_GET['passthru']) ){
	foreach ( $compressorGroups as &$group ){
		foreach ( $group['files'] as &$file ){
			if ( $file['path'] == $_GET['passthru'] ){
				header('Content-Type: text/'.$group['type']);
				
				$fileChanged = @filemtime('../'.$file['path']);
				if ( $fileChanged ){
					if ( $requestHeaders && is_array($requestHeaders) && array_key_exists('If-Modified-Since', $requestHeaders) && $fileChanged <= strtotime($requestHeaders['If-Modified-Since']) ){
						header('Last-Modified: '.date('r', $fileChanged), true, 304); // 304 Not Modified
						exit(0);
					}
					
					header('Last-Modified: '.date('r', $fileChanged));
				}
				
				if ( array_key_exists('preProcessor', $file) )
					echo $file['preProcessor'](file_get_contents('../'.$file['path']));
				else
					readfile('../'.$file['path']);
				
				exit(0);
			}
		}
	}
	header('Content-Type: text/plain', null, 403); // 403 Forbidden
	die('File disallowed');
}

// Don't continue if no group is given
if ( empty($_GET['group']) || empty($compressorGroups[$_GET['group']]) ){
	header('Content-Type: text/plain', null, 404); // 404 Not Found
	die('Invalid group');
}

// Extract group information and set headers
$group = $compressorGroups[$_GET['group']];
unset($compressorGroups);
header('Content-Type: text/'.$group['type']);

if ( $group['type'] == 'javascript' )
	require_once('../php/third_party/JShrink-0.2.class.php');

// Prepend ../ and remove ignored files
foreach ( $group['files'] as $key => &$file ){
	if ( $file['ignore'] )
		unset($group['files'][$key]);
	else
		$file['path'] = '../'.$file['path'];
}

// Find newest modification time
$newestChange = 0;
foreach ( $group['files'] as &$file ){
	$fileChanged = @filemtime($file['path']);
	if ( $fileChanged > $newestChange )
		$newestChange = $fileChanged;
}

// Send 304 if requested
if ( $requestHeaders && is_array($requestHeaders) && array_key_exists('If-Modified-Since', $requestHeaders) && $newestChange <= strtotime($requestHeaders['If-Modified-Since']) ){
	header('Last-Modified: '.date('r', $newestChange), true, 304); // 304 Not Modified
	exit(0);
}

header('Last-Modified: '.date('r', $newestChange));

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
	if ( array_key_exists('preProcessor', $file) )
		$source = $file['preProcessor']($source);
	
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
