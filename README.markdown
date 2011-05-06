Plethora
========

Plethora is an isometric game engine written in Javascript.
Copyright 2011 Joonas Haapala. See COPYING for details.

Level file format
-----------------

Levels are stored as UTF8-encoded text files. The files specify every block,
sound effect, script, etc that levels are made of.

Here's a sample:

{
	module: 'PlethoraOriginal',
	
	objects:
	[
		OBJECT_DEFINITION,
		OBJECT_DEFINITION,
		OBJECT_DEFINITION,
		...
	]
}

Where:

OBJECT_DEFINITION = 
[
	classname, // One of the classes defined in the selected module
	position,  // A three-element array for x,y,z coordinates of the object
	mass,      // A nonzero mass indicates mobile object. Zero = Fixed object
	...	
]



Contributions
-------------

Thanks to Roope Isoaho for his contributions to the tileset.

