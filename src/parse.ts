import { forEachEntry, groupAdjacent } from "./figura";
import { FiguraAnim, FiguraCube, FiguraData, FiguraGroup, FiguraItemDisplayContext, FiguraItemDisplayData, FiguraKeyframeHolder, FiguraMesh, FiguraTexture, FiguraVectorKeyframe } from "./figura_data";
import { isFiguraData } from "./figura_data.guard";

// Import the given figmodel into the project
export function parse_figura_data(data: any) {
	// Ensure data is a valid figmodel
	if (!isFiguraData(data))
		err('Invalid figmodel. Likely a bug with exporter! Please send your figmodel file to the Figura dev team so we can check it out!');
	const figmodel = data as FiguraData;

	// Process fields
	forEachEntry(data.textures ?? {}, parseTexture);
	forEachEntry(data.roots ?? {}, (name, group) => parseGroup(name, group, Project!.textures, undefined));
	forEachEntry(data.animations ?? {}, parseAnimation);

	// Add item display data (is this correct, to assign to the global var?)
	if (data.item_display_data) Project!.display_settings = parseItemDisplayData(data.item_display_data);
}

function parseTexture(name: string, figuraTexture: FiguraTexture) {
	// Check and fetch fields

	let dataUrl = 'data:image/png;base64,' + figuraTexture.png_bytes_base64;
	let tex = new Texture({
		name,
		path: figuraTexture.path,
		vanilla_texture_override: figuraTexture.vanilla_texture_override,
	}).fromDataURL(dataUrl).add(false);
	tex.uv_width = figuraTexture.uv_size[0];
	tex.uv_height = figuraTexture.uv_size[1];
	return tex;
}

function parseGroup(name: string, figuraGroup: FiguraGroup, textures: Texture[], parent: Group | undefined): Group {
	let origin = (parent?.origin.slice() ?? [0, 0, 0]).V3_add(figuraGroup.origin ?? [0, 0, 0]);

	if (figuraGroup.texture_index !== undefined) // 0 is falsy, so explicitly check for undefined
		checkInteger(figuraGroup.texture_index, 0, textures.length, 'Invalid figmodel - group "' + name + '" texture index must be a number in range');

	let texture = figuraGroup.texture_index !== undefined ? textures[figuraGroup.texture_index] : undefined;

	let group = new Group({
		name,
		origin,
		rotation: figuraGroup.rotation ?? [0,0,0],
		texture: texture?.uuid,
		mimic_part: figuraGroup.mimic_part,
		visibility: true,
	});
	group.parent = parent ?? 'root';
	group.init(); // Calling group.init() while group.parent is undefined will cause an error :P
	group.addTo(parent);

	// Fetch/check child groups, cubes, and meshes
	let cubes = figuraGroup.cubes ?? [];
	let meshes = figuraGroup.meshes ?? [];

	// Verify texture exists if there are cubes/meshes
	if (cubes.length !== 0 || meshes.length !== 0) {
		if (!texture) err('Invalid figmodel - group "' + name + '" has cubes or meshes, but does not have a texture');
	}

	// Process
	forEachEntry(figuraGroup.children ?? {}, (childname, child) => parseGroup(childname, child, textures, group));
	cubes.forEach(cube => parseCube(cube, group));
	meshes.forEach(mesh => parseMesh(mesh, group));
	
	return group;
}

function parseCube(figuraCube: FiguraCube, parent: Group): Cube {
	
	// Fetch main values, adjust from/to/origin from relative to absolute
	let from = figuraCube.from.V3_add(parent.origin);
	let to = figuraCube.to.V3_add(parent.origin);
	let origin = (figuraCube.origin ?? [0,0,0]).V3_add(parent.origin);
	let rotation = figuraCube.rotation ?? [0,0,0];
	let inflate = 0;

	// If all elements of inflateVec are the same (Very common!) Then set the inflate value.
	// Otherwise, modify from/to directly.
	let inflateVec = figuraCube.inflate ?? [0,0,0];
	if (inflateVec.every(v => v === inflateVec[0])) {
		inflate = inflateVec[0];
	} else {
		from.V3_subtract(inflateVec)
		to.V3_add(inflateVec)
	}

	// Fetch faces
	let bb_faces: {[dir: string]: CubeFaceOptions} = {};
	['west', 'east', 'down', 'up', 'north', 'south'].forEach((dir, i) => {
		if (figuraCube.faces[i] === null) return;
		let face = figuraCube.faces[i];
		bb_faces[dir] = {
			uv: [face.uv_min[0], face.uv_min[1], face.uv_max[0], face.uv_max[1]],
			rotation: face.rotation,
		}
	})

	// Create and setup cube
	let cube = new Cube({
		name: 'cube',
		from, to, inflate,
		origin, rotation,
		faces: bb_faces,
		box_uv: false
	});
	cube.parent = parent;
	cube.init();
	cube.addTo(parent);
	return cube;
}

function parseMesh(figuraMesh: FiguraMesh, parent: Group): Mesh {

	let origin = (figuraMesh.origin ?? [0,0,0]).V3_add(parent.origin);
	let rotation = figuraMesh.rotation ?? [0,0,0];

	// Create and setup mesh
	let mesh = new Mesh({
		name: 'mesh',
		origin, rotation,
		vertices: {}, // Need empty object, otherwise it automatically adds a cube
	});
	mesh.parent = parent;
	mesh.init();
	mesh.addTo(parent);

	// Parse and add vertices
	let positions: ArrayVector3[] = [];
	for (let vert of figuraMesh.vertices) {
		positions.push(vert.pos);
	}
	let vert_names = mesh.addVertices(...positions);

	// Parse and add faces
	let bb_faces: MeshFace[] = [];
	for (let face of figuraMesh.faces) {
		let names: string[] = [];
		let uv: {[key: string]: ArrayVector2} = {};

		for (let vertex of face.vertices) {
			let index = checkInteger(vertex.index, 0, vert_names.length, 'Invalid figmodel - mesh face vertex has missing or invalid vertex index');
			names.push(vert_names[index]);
			uv[vert_names[index]] = vertex.uv;
		}

		bb_faces.push(new MeshFace(mesh, {
			vertices: names, uv
		}));
	}
	mesh.addFaces(...bb_faces);

	return mesh;
}

const contexts: FiguraItemDisplayContext[] = ['none', 'thirdperson_lefthand', 'thirdperson_righthand', 'firstperson_lefthand', 'firstperson_righthand', 'head', 'gui', 'ground', 'fixed'];
function parseItemDisplayData(data: FiguraItemDisplayData): {[key: string]: DisplaySlot} {
	let result: {[key: string]: DisplaySlot} = {};
	for (let context of contexts) {
		if (data[context]) {
			result[context] = new DisplaySlot(context, {
				translation: data[context].translation ?? [0,0,0],
				rotation: data[context].rotation ?? [0,0,0],
				scale: data[context].scale ?? [1,1,1],
				mirror: [false, false, false]
			});
		}
	}
	return result;
}

// Parse and add an animation from the given data
function parseAnimation(name: string, figuraAnim: FiguraAnim) {
	const anim = new Blockbench.Animation({
		name,
		length: figuraAnim.length,
		snapping: figuraAnim.snapping
	});

	forEachEntry(figuraAnim.parts ?? {}, (path, kfholder) => {
		// Path is a slash-separated list of part names, starting from the model root.
		var items = Outliner.root
		var part: Group | null = null
		for (const name of path.split('/')) {
			const child = items.find(it => it.name == name) ?? err('Invalid figmodel - could not locate part with path "' + path + '"');
			if (child instanceof Group) {
				items = child.children
				part = child
			} else err('Invalid figmodel - animations can only refer to groups, but "' + path + '" does not.');
		}
		if (!part) err('Invalid figmodel - could not locate part with path "' + path + '"');
		// We now have the part. Parse keyframes.
		const animator = anim.getBoneAnimator(part);
		parseKeyframes(animator, 'position', kfholder.origin ?? [], figuraAnim.snapping);
		parseKeyframes(animator, 'rotation', kfholder.rotation ?? [], figuraAnim.snapping);
		parseKeyframes(animator, 'scale', kfholder.scale ?? [], figuraAnim.snapping);
	});

	// Add it to the project
	anim.add();
}

function parseKeyframes(animator: GeneralAnimator, channel: string, frames: FiguraVectorKeyframe[], snapping: number | undefined) {
	groupAdjacent(frames, f => f.time)
	.map(adjacents => {
		let kf = adjacents[0]
		const options: KeyframeOptions = {
			channel,
			data_points: adjacents.map(figvec => ({
				x: figvec.data[0],
				y: figvec.data[1],
				z: figvec.data[2]
			})),
			time: adjacents[0].time / (snapping ?? 1),
		}
		switch (kf.interpolation) {
			case 'linear': options.interpolation = 'linear'; break;
			case 'catmullrom': options.interpolation = 'catmullrom'; break;
			case 'step': options.interpolation = 'step'; break;
			default: switch (kf.interpolation.kind) {
				case 'bezier':
					options.interpolation = 'bezier';
					options.bezier_left_time = kf.interpolation.left_time;
					options.bezier_left_value = kf.interpolation.left_value;
					options.bezier_right_time = kf.interpolation.right_value;
					options.bezier_right_value = kf.interpolation.right_value;
					break;
				default:
					err("Invalid state during figmodel parsing; invalid interpolation, should never occur. Please contact devs!");
			}
		}
		return options
	})
	.forEach(kf => animator.addKeyframe(kf));
}

// Helpers

// Min inclusive, max exclusive
function checkInteger(item: any, min: number, max: number, msg: string): number {
	return (Number.isInteger(item) && item >= min && item < max) ? item : err(msg);
}

function err(message: string): never {
	throw message;
}
