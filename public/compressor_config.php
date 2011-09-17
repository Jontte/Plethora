<?php

$compressorGroups = array(
	'js' => array(
		'type' => 'javascript',
		'files' => array(
			'json2.js',
			array(
				'path' => 'jquery-1.6.3.min.js',
				'compress' => false
			),
			array(
				'path' => 'jquery-ui-1.8.12.custom.min.js',
				'compress' => false
			),
			array(
				'path' => 'DataTables-1.8.2/jquery.dataTables.min.js',
				'compress' => false
			),
			array(
				'path' => 'jquery-mousewheel-3.0.4/jquery.mousewheel.min.js',
				'compress' => false
			),
			//array( // weird bugging, included separately for now
			//	'path' => 'less/less-1.1.3.min.js',
			//	'compress' => false
			//),
			'jquery.toastmessage.js',
			'../util.js',
			array(
				'path' => '../jsbih.js', // this file errors on compression, temporarily left uncompressed
				'compress' => false
			),
			'../key.js',
			'../effects.js',
			'../world.js',
			'../draw.js',
			'../editor.js',
			'../collision.js',
			'../audio.js',
			'../main.js',
			'../modules/PlethoraOriginal.js'
		)
	),
	'css' => array(
		'type' => 'css',
		'files' => array(
			'redmond/jquery-ui-1.8.12.custom.css',
			'jquery.toastmessage.css',
			'DataTables-1.8.2/table.css'
		)
	)
);

// Fill omitted values
foreach ( $compressorGroups as &$group ){
	foreach ( $group['files'] as &$file ){
		if ( !is_array($file) )
			$file = array('path'=>$file);
		
		if ( !array_key_exists('compress', $file) )
			$file['compress'] = true;
		if ( !array_key_exists('name', $file) )
			$file['name'] = $file['path'];
	}
}
