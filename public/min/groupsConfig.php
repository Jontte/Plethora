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
		new Minify_Source(array(
			'filepath' => "$dname/../jquery-1.6.3.min.js",
			'minifier' => create_function('$a', 'return $a;')
		)),
		new Minify_Source(array(
			'filepath' => "$dname/../jquery-ui-1.8.12.custom.min.js",
			'minifier' => create_function('$a', 'return $a;')
		)),
		"$dname/../jquery.toastmessage.js",
		"$dname/../json_parse.js",
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
		"$dname/../style.css",
		"$dname/../redmond/jquery-ui-1.8.12.custom.css",
		"$dname/../jquery.toastmessage.css"
	)
	
    // 'css' => array('//css/file1.css', '//css/file2.css'),

    // custom source example
    /*'js2' => array(
        dirname(__FILE__) . '/../min_unit_tests/_test_files/js/before.js',
        // do NOT process this file
        new Minify_Source(array(
            'filepath' => dirname(__FILE__) . '/../min_unit_tests/_test_files/js/before.js',
            'minifier' => create_function('$a', 'return $a;')
        ))
    ),//*/

    /*'js3' => array(
        dirname(__FILE__) . '/../min_unit_tests/_test_files/js/before.js',
        // do NOT process this file
        new Minify_Source(array(
            'filepath' => dirname(__FILE__) . '/../min_unit_tests/_test_files/js/before.js',
            'minifier' => array('Minify_Packer', 'minify')
        ))
    ),//*/
);
