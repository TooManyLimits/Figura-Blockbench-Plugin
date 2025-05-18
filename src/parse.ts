
// Import the given figmodel into the project
export function parse_figura_data(data: any) {
	Project!.textures = checkArray(data.textures, 'Invalid figmodel - missing or invalid textures array')
		.map(texture => parseTexture(checkObject(texture, 'Invalid figmodel - texture must be an {object}')));

	Project!.outliner = checkArray(data.roots, 'Invalid figmodel - missing or invalid roots array')
		.map(g => parseGroup(g, Project!.textures, undefined));

	if (data.item_display_data)
		Project!.display_settings = parseItemDisplayData(checkObject(data.item_display_data, 'Invalid figmodel - item display data should be object'));
}

function parseTexture(obj: any): Texture {
	// Check and fetch fields
	let name = checkString(obj.name, 'Invalid figmodel - texture has missing or invalid name');
	let uv_size = checkVec2(obj.uv_size, 'Invalid figmodel - texture "' + name + '" has missing or invalid uv_size');
	let dataUrl = 'data:image/png;base64,' + checkString(obj.png_bytes_base64, 'Invalid figmodel - texture "' + name + '" png data should be optional base64 string');

	let tex = new Texture({
		name,
		path: optString(obj.path, 'Invalid figmodel - texture "' + name + '" path should be optional string'),
		vanilla_texture_override: optString(obj.vanilla_texture_override, 'Invalid figmodel - texture "' + name + '" vanilla texture override should be optional string')
	}).fromDataURL(dataUrl).add(false);
	tex.uv_width = uv_size[0];
	tex.uv_height = uv_size[1];
	return tex;
}

function parseGroup(obj: any, textures: Texture[], parent: Group | undefined): Group {
	let name = checkString(obj.name, 'Invalid figmodel - group has missing or invalid name');
	let origin = (parent?.origin.slice() ?? [0, 0, 0]).V3_add(checkVec3(obj.origin, 'Invalid figmodel - group "' + name + '" has missing or invalid origin'));
	let texture = mapOptional(optInteger(obj.texture_index, 0, textures.length, 'Invalid figmodel - group "' + name + '" texture index must be a number in range'), i => textures[i]);

	let group = new Group({
		name,
		origin,
		rotation: checkVec3(obj.rotation, 'Invalid figmodel - group "' + name + '" has missing or invalid rotation'),
		texture: texture?.uuid,
		mimic_part: optString(obj.mimic_part, 'Invalid figmodel - group "' + name + '" mimic_part should be optional string'),
		visibility: true,
	});
	group.parent = parent ?? 'root';
	group.init();
	group.addTo(parent);

	// Fetch/check child groups, cubes, and meshes
	let children = checkArray(obj.children, 'Invalid figmodel - group "' + name + '" has missing or invalid children')
	let cubes = checkArray(obj.cubes, 'Invalid figmodel - group "' + name + '" has missing or invalid cubes');
	let meshes = checkArray(obj.meshes, 'Invalid figmodel - group "' + name + '" has missing or invalid meshes');

	// Verify texture exists if there are cubes/meshes
	if (cubes.length !== 0 || meshes.length !== 0) {
		if (!texture) throw 'Invalid figmodel - group "' + name + '" has cubes or meshes, but does not have a texture';
	}

	// Process
	children.forEach(child => parseGroup(checkObject(child, 'Invalid figmodel - group must be an {object}'), textures, group));
	cubes.forEach(cube => parseCube(checkObject(cube, 'Invalid figmodel - cube must be an {object}'), group));
	meshes.forEach(mesh => parseMesh(checkObject(mesh, 'Invalid figmodel - mesh must be an {object}'), group));
	
	return group;
}

function parseCube(obj: any, parent: Group): Cube {
	
	// Fetch main values, adjust from/to/origin from relative to absolute
	let from = checkVec3(obj.from, 'Invalid figmodel - cube has missing or invalid "from"').V3_add(parent.origin);
	let to = checkVec3(obj.to, 'Invalid figmodel - cube has missing or invalid "to"').V3_add(parent.origin);
	let origin = checkVec3(obj.origin, 'Invalid figmodel - cube has missing or invalid origin').V3_add(parent.origin);
	let rotation = checkVec3(obj.rotation, 'Invalid figmodel - cube has missing or invalid rotation');
	let inflate = 0;

	// If all elements of inflateVec are the same (Very common!) Then set the inflate value.
	// Otherwise, modify from/to directly.
	let inflateVec = checkVec3(obj.inflate, 'Invalid figmodel - cube has missing or invalid "inflate"');
	if (inflateVec.every(v => v === inflateVec[0])) {
		inflate = inflateVec[0];
	} else {
		from.V3_subtract(inflateVec)
		to.V3_add(inflateVec)
	}

	// Fetch faces
	let faces = checkArray(obj.faces, 'Invalid figmodel - cube has missing or invalid "faces"');
	let bb_faces: {[dir: string]: CubeFaceOptions} = {};
	['west', 'east', 'down', 'up', 'north', 'south'].forEach((dir, i) => {
		if (faces[i] === null) return;
		let face = checkObject(faces[i], 'Invalid figmodel - cube face should be {object} or null');
		let uv_min = checkVec2(face.uv_min, 'Invalid figmodel - cube face has missing or invalid uv_min');
		let uv_max = checkVec2(face.uv_max, 'Invalid figmodel - cube face has missing or invalid uv_max');
		let rotation = face.rotation;
		if (rotation !== 0 && rotation !== 90 && rotation !== 180 && rotation !== 270)
			throw 'Invalid figmodel - cube face has invalid rotation. Expected 0, 90, 180, or 270, found ' + rotation;
		bb_faces[dir] = {
			uv: [uv_min[0], uv_min[1], uv_max[0], uv_max[1]],
			rotation,
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

function parseMesh(obj: any, parent: Group): Mesh {

	let origin = checkVec3(obj.origin, 'Invalid figmodel - mesh has missing or invalid origin').V3_add(parent.origin);
	let rotation = checkVec3(obj.rotation, 'Invalid figmodel - mesh has missing or invalid rotation');

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
	let vertices = checkArray(obj.vertices, 'Invalid figmodel - mesh has missing or invalid vertices');
	for (let vert of vertices) {
		let pos = checkVec3(vert.pos, 'Invalid figmodel - mesh vertex has missing or invalid position');
		positions.push(pos);
	}
	let vert_names = mesh.addVertices(...positions);

	// Parse and add faces
	let bb_faces: MeshFace[] = [];
	let faces = checkArray(obj.faces, 'Invalid figmodel - mesh has missing or invalid faces');
	for (let face of faces) {
		let vertices = checkArray(face.vertices, 'Invalid figmodel - mesh face has missing or invalid vertices');
		if (vertices.length < 3 || vertices.length > 4) throw 'Invalid figmodel - mesh face should have 3 or 4 vertices, found ' + vertices.length;
		
		let names: string[] = [];
		let uv: {[key: string]: ArrayVector2} = {};

		for (let vertex of vertices) {
			let index = checkInteger(vertex.index, 0, vert_names.length, 'Invalid figmodel - mesh face vertex has missing or invalid vertex index');
			names.push(vert_names[index]);
			uv[vert_names[index]] = checkVec2(vertex.uv, 'Invalid figmodel - mesh face vertex has missing or invalid uv');
		}

		bb_faces.push(new MeshFace(mesh, {
			vertices: names, uv
		}));
	}
	mesh.addFaces(...bb_faces);

	return mesh;
}

const contexts = ['none', 'thirdperson_lefthand', 'thirdperson_righthand', 'firstperson_lefthand', 'firstperson_righthand', 'head', 'gui', 'ground', 'fixed'];
function parseItemDisplayData(data: any): {[key: string]: DisplaySlot}
{
	let result: any = {};
	for (let context of contexts) {
		if (data[context]) {
			checkObject(data[context], 'Invalid figmodel - expected object for item render context');
			result[context] = new DisplaySlot(context, {
				translation: checkVec3(data[context].translation, 'Invalid figmodel - item render translation should be vec3'),
				rotation: checkVec3(data[context].rotation, 'Invalid figmodel - item render rotation should be vec3'),
				scale: checkVec3(data[context].scale, 'Invalid figmodel - item render scale should be vec3'),
				mirror: [false, false, false]
			});
		}
	}
	return result;
}

// Various random little helpers

function mapOptional<T, R>(item: T | undefined, mapper: (v: T) => R): R | undefined {
	return item === undefined ? undefined : mapper(item);
}

function checkObject(item: any, msg: string): any {
	return (typeof item === 'object' && item !== null) ? item : err(msg);
}

// Min inclusive, max exclusive
function checkInteger(item: any, min: number, max: number, msg: string): number {
	return (Number.isInteger(item) && item >= min && item < max) ? item : err(msg);
}
function optInteger(item: any, min: number, max: number, msg: string): number | undefined {
	return item === undefined ? undefined : checkInteger(item, min, max, msg);
}

function checkString(item: any, msg: string): string {
	return typeof item === 'string' ? item : err(msg);
}
function optString(item: any, msg: string): string | undefined {
	return item === undefined ? undefined : checkString(item, msg);
}

function checkBoolean(item: any, msg: string): boolean {
	return typeof item === 'boolean' ? item : err(msg);
}
function optBoolean(item: any, msg: string): boolean | undefined {
	return item === undefined ? undefined : checkBoolean(item, msg);
}

function checkVec2(item: any, msg: string): ArrayVector2 {
	if (!Array.isArray(item)) err(msg);
	if (item.length != 2) err(msg);
	if (!item.every(elem => typeof elem === 'number')) err(msg);
	return item.slice() as ArrayVector2;
}
function checkVec3(item: any, msg: string): ArrayVector3 {
	if (!Array.isArray(item)) err(msg);
	if (item.length != 3) err(msg);
	if (!item.every(elem => typeof elem === 'number')) err(msg);
	return item.slice() as ArrayVector3;
}

function checkArray(item: any, msg: string): any[] {
	return Array.isArray(item) ? item : err(msg);
}

function err(message: string): never {
	throw message;
}
