
// The purpose behind this is the purpose of having a custom format in the first place.
// It's so that changes to Blockbench internals / file format won't require an update to Figura itself.
// Only the blockbench plugin would need to be updated to reflect the new blockbench internals.

// Global Figura data object for one model. This will be created and then serialized in the codec.
// Don't change these types carelessly - Figura's java code will depend on them!

/** @see {isFiguraData} ts-auto-guard:type-guard */
export type FiguraData = {
	roots?: Record<string, FiguraGroup>,
	textures?: Record<string, FiguraTexture>, // Textures in the model, by name
	animations?: Record<string, FiguraAnim>, // Animations in the model, by name
	item_display_data?: FiguraItemDisplayData, // Only used in item models
}

/** @see {isFiguraGroup} ts-auto-guard:type-guard */
export type FiguraGroup = {
	origin?: FiguraVec3, // Default 0,0,0
	rotation?: FiguraVec3, // Degrees, XYZ. Default 0,0,0
	children?: Record<string, FiguraGroup>, // Default {}
	mimic_part?: string, // Vanilla model part to mimic transforms of
	// All cubes/meshes in this group must use a singular texture.
	// This is that texture's index. The blockbench "per_group_texture" Format boolean
	// should help us with this, mostly.
	// A group which has any cubes or meshes MUST also have a texture index, or it's an error.
	texture_index?: number,
	cubes?: FiguraCube[], // Default []
	meshes?: FiguraMesh[], // Default []
}

/** @see {isFiguraCube} ts-auto-guard:type-guard */
export type FiguraCube = {
	origin?: FiguraVec3, // Default 0,0,0
	rotation?: FiguraVec3, // Default 0,0,0
	from: FiguraVec3,
	to: FiguraVec3,
	inflate?: FiguraVec3, // Default 0,0,0
	// Ordering of faces:
	// Neg X, Pos X, Neg Y, Pos Y, Neg Z, Pos Z.
	faces: Tuple<FiguraCubeFace | null, 6>,
}
/** @see {isFiguraCubeFace} ts-auto-guard:type-guard */
export type FiguraCubeFace = {
	uv_min: FiguraVec2, // Generally integer. Divide by texture uv_size to get 0-1 values.
	uv_max: FiguraVec2, // Generally integer. Divide by texture uv_size to get 0-1 values.
	rotation?: 0 | 90 | 180 | 270, // Default 0
}

/** @see {isFiguraMesh} ts-auto-guard:type-guard */
export type FiguraMesh = {
	origin?: FiguraVec3, // Default 0,0,0
	rotation?: FiguraVec3, // ZYX order :P Thanks Blockbench. Default 0,0,0
	vertices: FiguraMeshVertex[],
	faces: FiguraMeshFace[],
}
/** @see {isFiguraMeshVertex} ts-auto-guard:type-guard */
export type FiguraMeshVertex = {
	// Position of the vertex
	pos: FiguraVec3,
}
/** @see {isFiguraMeshFace} ts-auto-guard:type-guard */
export type FiguraMeshFace = {
	// Either 3 or 4 vertices.
	vertices: Tuple<FiguraMeshVertexInfo, 3> | Tuple<FiguraMeshVertexInfo, 4>,
}
/** @see {isFiguraMeshVertexInfo} ts-auto-guard:type-guard */
export type FiguraMeshVertexInfo = {
	index: number, // Index into mesh's vertices array
	uv: FiguraVec2 // UV of this vertex in this face
}

// Data for a texture.
/** @see {isFiguraTexture} ts-auto-guard:type-guard */
export type FiguraTexture = {
	path?: string,
	uv_size: FiguraVec2,
	vanilla_texture_override?: string,
	png_bytes_base64: string, // No prefix
}

// Item display data.
/** @see {isFiguraItemDisplayData} ts-auto-guard:type-guard */
export type FiguraItemDisplayData = { [key in FiguraItemDisplayContext]?: FiguraItemDisplayTransform }
/** @see {isFiguraItemDisplayContext} ts-auto-guard:type-guard */
export type FiguraItemDisplayContext = 'none' | 'thirdperson_lefthand' | 'thirdperson_righthand' | 'firstperson_lefthand' | 'firstperson_righthand' | 'head' | 'gui' | 'ground' | 'fixed'
/** @see {isFiguraItemDisplayTransform} ts-auto-guard:type-guard */
export type FiguraItemDisplayTransform = {
	translation?: FiguraVec3, // Default 0,0,0
	rotation?: FiguraVec3, // Default 0,0,0
	scale?: FiguraVec3 // Default 1,1,1
}

// Animations

// An animation is a mapping from model part paths (slash-separated) to keyframes for that part
// It also has other keyframes which aren't tied to any particular part.
/** @see {isFiguraAnim} ts-auto-guard:type-guard */
export type FiguraAnim = {
	length: number,
	snapping?: number,
	strength?: number,
	loop?: 'once' | 'hold' | 'loop', // Default 'once'
	parts?: { [part_path: string]: FiguraKeyframeHolder }, // Default {}
	script_keyframes?: FiguraScriptKeyframe[] // Default []
}
// Holds keyframes in various different channels.
/** @see {isFiguraKeyframeHolder} ts-auto-guard:type-guard */
export type FiguraKeyframeHolder = {
	origin?: FiguraVectorKeyframe[], // Default []
	rotation?: FiguraVectorKeyframe[], // Default []
	scale?: FiguraVectorKeyframe[], // Default []
}
/** @see {isFiguraScriptKeyframe} ts-auto-guard:type-guard */
export type FiguraScriptKeyframe = {
	time: number, // If the animation has snapping, this is an integer multiple of 1/snapping seconds. If not, 'time' is a direct decimal in seconds.
	data: string, // The molang snippet to execute
}
// Keyframe for a vec3 value, which can be interpolated accordingly
/** @see {isFiguraVectorKeyframe} ts-auto-guard:type-guard */
export type FiguraVectorKeyframe = {
	time: number, // If the animation has snapping, this is an integer multiple of 1/snapping seconds. If not, 'time' is a direct decimal in seconds.
	data: AnimVec3,
	interpolation: FiguraKeyframeInterpolation,
}
/** @see {isFiguraKeyframeInterpolation} ts-auto-guard:type-guard */
export type FiguraKeyframeInterpolation = 'linear' | 'catmullrom' | 'step' | BezierInterpolation;
export type BezierInterpolation = {
	kind: 'bezier',
	left_time: FiguraVec3,
	left_value: FiguraVec3,
	right_time: FiguraVec3,
	right_value: FiguraVec3
}
export type AnimValue = number | string // Number or a molang string
export type AnimVec3 = Tuple<AnimValue, 3>

// Basic types
/** @see {isFiguraVec2} ts-auto-guard:type-guard */
export type FiguraVec2 = Tuple<number, 2>;
/** @see {isFiguraVec3} ts-auto-guard:type-guard */
export type FiguraVec3 = Tuple<number, 3>;

// Helper...
export type Tuple<T, N extends Number, A extends T[] = []> = A["length"] extends N ? A : Tuple<T, N, [...A, T]>
