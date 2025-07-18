
// Declare things to extend the blockbench type definitions.

// Add our own properties to the Group class (and options) so we don't need to cast to set/get them.
interface Group {
	mimic_part?: string,
}
interface GroupOptions {
	mimic_part?: string,
	texture?: string,
}

// Add our own properties to Texture class (and options)
interface Texture {
	vanilla_texture_override?: string,
}
interface TextureData {
	vanilla_texture_override?: string,
}

// These aren't in the types, so add them ourselves.
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
interface OutlinerNode {
	needsUniqueName: ConditionResolvable
}
interface Action {
	menu_node: HTMLElement
}
// Whoever made the types thought it was "rotations" when it's actually "rotation".
interface BoneAnimator {
	rotation: _Keyframe[]
	rotations: undefined
}
interface NullObjectAnimator {
	rotation: _Keyframe[]
	rotations: undefined
}

declare var open_menu: Menu | null
declare var flipNameOnAxis: (node: OutlinerNode, axis: number, check?: (node: OutlinerNode) => boolean, original_name?: string) => void;
declare var mirrorSelected: (axis: number) => void;
