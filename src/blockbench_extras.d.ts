
// Declare things to extend the blockbench type definitions.

// Add our own properties to the Group class (and options) so we don't need to cast to set/get them.
interface Group {
	vanilla_root?: string,
	replace_vanilla_root?: boolean,

	scale: ArrayVector3,

}
interface GroupOptions {
	vanilla_root?: string,
	replace_vanilla_root?: boolean,
	texture?: string,
}

// Add our own properties to Texture class (and options)
interface Texture {
	vanilla_texture_override?: string,
}
interface TextureData {
	vanilla_texture_override?: string,
}


// These aren't in the types for some reason? 
// Add them manually before waiting for blockbench-types repo to update
interface Mesh {
	origin: ArrayVector3,
	rotation: ArrayVector3,
}
interface Texture {
	add(undo?: boolean, uv_size_from_resolution?: boolean): Texture
}
interface Cube {
	box_uv?: boolean,
}
interface ModelProject {
	display_settings: {[key: string]: DisplaySlot}
}

// namespace THREE {
// 	interface Object3D {
// 		fix_rotation?: THREE.Euler,
// 		fix_position?: THREE.Vector3,
// 		fix_scale?: THREE.Vector3,
// 	}
// }

