<?php
/**
 * Groups configuration for default Minify implementation
 * @package Minify
 */

/** 
 * You may wish to use the Minify URI Builder app to suggest
 * changes. http://yourdomain/min/builder/
 **/

$dname = dirname(__FILE__);
return array(
	'js' => array(
		"$dname/../json2.js",
		new Minify_Source(array(
			'filepath' => "$dname/../jquery-1.6.3.min.js",
			'minifier' => create_function('$a', 'return $a;')
		)),
		new Minify_Source(array(
			'filepath' => "$dname/../jquery-ui-1.8.12.custom.min.js",
			'minifier' => create_function('$a', 'return $a;')
		)),
		new Minify_Source(array(
			'filepath' => "$dname/../DataTables-1.8.2/jquery.dataTables.min.js",
			'minifier' => create_function('$a', 'return $a;')
		)),
		new Minify_Source(array(
			'filepath' => "$dname/../jquery-mousewheel-3.0.4/jquery.mousewheel.min.js",
			'minifier' => create_function('$a', 'return $a;')
		)),
		"$dname/../jquery.toastmessage.js",
		"$dname/../../jsbih.js",
		"$dname/../../util.js",
		"$dname/../../key.js",
		"$dname/../../effects.js",
		"$dname/../../world.js",
		"$dname/../../draw.js",
		"$dname/../../editor.js",
		"$dname/../../collision.js",
		"$dname/../../audio.js",
		"$dname/../../main.js",
		"$dname/../../modules/PlethoraOriginal.js"
	),
	'css' => array(
		"$dname/../redmond/jquery-ui-1.8.12.custom.css",
		"$dname/../jquery.toastmessage.css",
		"$dname/../DataTables-1.8.2/table.css",
		"$dname/../style.css"
	)
);
