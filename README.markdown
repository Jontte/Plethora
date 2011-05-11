Plethora
========

Plethora is an isometric game engine written in Javascript.
Plethora is published under the 3-clause BSD license. See COPYING for details.

Level file format
-----------------

Levels are stored as UTF8-encoded text files. The files specify every block,
sound effect, script, etc that levels are made of.

Here's a sample:

{
	module: 'PlethoraOriginal_v1.0',
	
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


The following people have contributed a great deal of graphics:
	* Roope "Furry" Isoaho
	* Mika "GiftOfDeath" Pilssari


