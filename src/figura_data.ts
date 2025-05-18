
// The purpose behind this is the purpose of having a custom format in the first place.
// It's so that changes to Blockbench internals / file format won't require an update to Figura itself.
// Only the blockbench plugin would need to be updated to reflect the new blockbench internals.

// Global Figura data object for one model. This will be created and then serialized in the codec.
// Don't change these types carelessly - Figura's java code will depend on them!

export type FiguraData = {
	roots: FiguraGroup[],
	textures: FiguraTexture[],
	item_display_data?: FiguraItemDisplayData, // Only used in item models
}

export type FiguraGroup = {
	name: string,
	origin: FiguraVec3,
	rotation: FiguraVec3, // Degrees, XYZ
	children: FiguraGroup[],
	mimic_part?: string, // Vanilla model part to mimic transforms of
	// All cubes/meshes in this group must use a singular texture.
	// This is that texture's index. The blockbench "per_group_texture" Format boolean
	// should help us with this, mostly.
	// A group which has any cubes or meshes MUST also have a texture index, or it's an error.
	texture_index?: number,
	cubes: FiguraCube[],
	meshes: FiguraMesh[],
}

export type FiguraCube = {
	origin: FiguraVec3,
	rotation: FiguraVec3,
	from: FiguraVec3,
	to: FiguraVec3,
	inflate: FiguraVec3,
	// Ordering of faces:
	// Neg X, Pos X, Neg Y, Pos Y, Neg Z, Pos Z.
	faces: Tuple<FiguraCubeFace | null, 6>,
}
export type FiguraCubeFace = {
	uv_min: FiguraVec2, // Generally integer. Divide by texture uv_size to get 0-1 values.
	uv_max: FiguraVec2, // Generally integer. Divide by texture uv_size to get 0-1 values.
	rotation: 0 | 90 | 180 | 270,
}

export type FiguraMesh = {
	origin: FiguraVec3,
	rotation: FiguraVec3, // ZYX order :P Thanks Blockbench
	vertices: FiguraMeshVertex[],
	faces: FiguraMeshFace[],
}
export type FiguraMeshVertex = {
	// Position of the vertex
	pos: FiguraVec3,
}
export type FiguraMeshFace = {
	// Either 3 or 4 vertices.
	vertices: Tuple<FiguraMeshVertexInfo, 3> | Tuple<FiguraMeshVertexInfo, 4>,
}
export type FiguraMeshVertexInfo = {
	index: number, // Index into mesh's vertices array
	uv: FiguraVec2 // UV of this vertex in this face
}

// Data for a texture.
export type FiguraTexture = {
	name: string,
	path?: string,
	uv_size: FiguraVec2,
	vanilla_texture_override?: string,
	png_bytes_base64: string, // No prefix
}

// Item display data.
export type FiguraItemDisplayData = {[key in FiguraItemDisplayContext]?: FiguraItemDisplayTransform}
export type FiguraItemDisplayContext = 'none' | 'thirdperson_lefthand' | 'thirdperson_righthand' | 'firstperson_lefthand' | 'firstperson_righthand' | 'head' | 'gui' | 'ground' | 'fixed'
export type FiguraItemDisplayTransform = {
	translation: FiguraVec3,
	rotation: FiguraVec3,
	scale: FiguraVec3
}

// Basic types
export type FiguraVec2 = Tuple<number, 2>;
export type FiguraVec3 = Tuple<number, 3>;

// Helper...
export type Tuple<T, N extends Number, A extends T[] = []> = A["length"] extends N ? A : Tuple<T, N, [...A, T]>
