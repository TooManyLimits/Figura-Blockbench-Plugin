
// Declare things to extend the blockbench type definitions.

// Add our own properties to the Group class (and options) so we don't need to cast to set/get them.
interface Group {
	mimic_part?: string,
}
interface GroupOptions {
	mimic_part?: string,
	texture?: UUID,
}

// Add our own properties to Texture class (and options)
interface Texture {
	vanilla_texture_override?: string,
}
interface TextureData {
	vanilla_texture_override?: string,
}

// Whoever made the types thought it was "rotations" when it's actually "rotation".
interface BoneAnimator {
	rotation: _Keyframe[]
	rotations: undefined
}

declare var open_menu: Menu | null