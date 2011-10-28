<?php

// Paths relative to frontend/

$cacheDir = 'compressor_cache';

$compressorGroups = array(
	'js' => array(
		'type' => 'javascript',
		'files' => array(
			// Included directly
			array(
				'path' => 'js/third_party/excanvas.js',
				'ignore' => true
			),
			array(
				'path' => 'js/third_party/less-1.1.3.min.js',
				'ignore' => true
			),
			
			
			'js/third_party/json2.js',
			array(
				'path' => 'js/third_party/recaptcha_ajax.js',
				'compress' => false
			),
			array(
				'path' => 'js/third_party/jquery-1.6.3.min.js',
				'compress' => false
			),
			array(
				'path' => 'js/third_party/jquery-ui-1.8.12.custom.min.js',
				'compress' => false
			),
			array(
				'path' => 'js/third_party/jquery.dataTables.min.js',
				'compress' => false
			),
			array(
				'path' => 'js/third_party/jquery.mousewheel.min.js',
				'compress' => false
			),
			'js/third_party/jquery.toastmessage.js',
			'../engine/util.js',
			'../engine/jsbih.js',
			'../engine/key.js',
			'../engine/effects.js',
			'../engine/world.js',
			'../engine/draw.js',
			'../engine/editor.js',
			'../engine/physics.js',
			'../engine/audio.js',

			'../engine/modules/PlethoraOriginal.js',
			'../engine/modules/TubeWorks.js',
			
			'js/main.js',
			'js/dialogs.js',
			'js/session.js',
			'js/init.js'
		)
	),
	'css' => array(
		'type' => 'css',
		'files' => array(
			array(
				'path' => 'css/third_party/jquery-ui-1.8.12.custom.css',
				'preProcessor' => function($str){
					return preg_replace('/url\\(images\\//', 'url(img/third_party/redmond/', $str);
				}
			),
			'css/third_party/jquery.toastmessage.css',
			'css/third_party/dataTables.css'
		)
	)
);

// Fill omitted values
$cacheDir = "../$cacheDir";
foreach ( $compressorGroups as $groupName => &$group ){
	foreach ( $group['files'] as &$file ){
		if ( !is_array($file) )
			$file = array('path'=>$file);
		
		if ( !array_key_exists('ignore', $file) )
			$file['ignore'] = false;
		if ( !array_key_exists('compress', $file) )
			$file['compress'] = true;
		if ( !array_key_exists('name', $file) )
			$file['name'] = $file['path'];
		if ( !array_key_exists('cacheFile', $file) )
			$file['cacheFile'] = "$cacheDir/$groupName-" . str_replace(array('/', ':', '\\'), '-', $file['path']);
	}
}
