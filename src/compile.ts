import { FiguraCube, FiguraCubeFace, FiguraData, FiguraGroup, FiguraItemDisplayContext, FiguraItemDisplayTransform, FiguraMesh, FiguraMeshFace, FiguraMeshVertex, FiguraMeshVertexInfo, FiguraVec2, FiguraVec3, Tuple } from "./figura_data";

// Compile the global data in the project into a FiguraData.
// Can throw a string error for display.
export function compile_figura_data(): FiguraData {

	// Generate groups!
	let parts = Project!.outliner
		.filter(part => part instanceof Group)
		.map(group => compile_group(group, [0,0,0]));

	// Cubes or meshes are not currently allowed at the top level, because they're not in a group, so cannot have a texture index.
	for (var node of Project!.outliner) {
		if (node instanceof Cube || node instanceof Mesh) {
			node.select();
			throw 'Top-level cubes and meshes, like "' + node.name + '", are not supported yet! For now, they must be wrapped in a group.';
		}
	}

	// Fetch item display data
	let display_contexts: FiguraItemDisplayContext[] = ['none', 'thirdperson_lefthand', 'thirdperson_righthand', 'firstperson_lefthand', 'firstperson_righthand', 'head', 'gui', 'ground', 'fixed'];
	let item_display_data: {[context in FiguraItemDisplayContext]?: FiguraItemDisplayTransform} = {}
	for (var display_context of display_contexts) {
		let settings = Project?.display_settings[display_context];
		if (settings) {
			item_display_data[display_context] = {
				translation: settings.translation,
				rotation: settings.rotation,
				scale: settings.scale
			};
		}
	}

	// Return.
	return {
		part_data: {
			name: "", origin: [0,0,0], rotation: [0,0,0], children: parts, cubes: [], meshes: []
		},
		textures: Texture.all.map(tex => ({
			name: tex.name,
			path: tex.path,
			uv_size: [tex.uv_width, tex.uv_height],
			vanilla_texture_override: tex.vanilla_texture_override,
			png_bytes_base64: tex.getBase64()
		})),
		item_display_data
	}
}


function compile_group(group: Group, absolute_parent_origin: ArrayVector3): FiguraGroup {

	// Fetch the texture on this group, if any.
	let texture_index: number | undefined = undefined;
	if (group.texture) {
		texture_index = Texture.all.findIndex(tex => tex.uuid === group.texture);
		if (texture_index === -1) texture_index = undefined;
	}
	let texture = (texture_index !== undefined) ? Texture.all[texture_index] : null;

	// Traverse sub-elements...
	let absolute_origin = group.origin;

	let children_groups = group.children
		.filter(node => node instanceof Group)
		.map(group => compile_group(group, absolute_origin));

	// Cubes and meshes require there to be a texture applied
	if (!texture && group.children.some(node => node instanceof Cube || node instanceof Mesh)) {
		group.select();
		throw 'Group "' + group.name + '" does not have a texture applied!\nDue to a Blockbench bug, cubes might appear to have a texture but their *group* does not.\nRight-click the *group* and select the texture!'
	}

	let cubes = group.children
		.filter(node => node instanceof Cube)
		.map(cube => compile_cube(cube, absolute_origin));
	let meshes = group.children
		.filter(node => node instanceof Mesh)
		.map(mesh => compile_mesh(mesh, absolute_origin));

	return {
		name: group.name,
		origin: absolute_origin.slice().V3_subtract(absolute_parent_origin),
		rotation: group.rotation,
		children: children_groups,
		texture_index: texture_index,
		cubes: cubes,
		meshes: meshes,
		vanilla_root: group.vanilla_root || undefined,
		replace_vanilla_root: group.replace_vanilla_root || undefined
	}
}

function compile_cube(cube: Cube, absolute_parent_origin: FiguraVec3): FiguraCube {
	return {
		origin: cube.origin.slice().V3_subtract(absolute_parent_origin),
		rotation: cube.rotation.slice() as ArrayVector3,
		from: cube.from.slice().V3_subtract(absolute_parent_origin),
		to: cube.to.slice().V3_subtract(absolute_parent_origin),
		inflate: [cube.inflate, cube.inflate, cube.inflate],
		// Order of faces is important! See definition of FiguraCube
		faces: ['west', 'east', 'down', 'up', 'north', 'south']
			.map(s => cube.faces[s] ? compile_cube_face(cube.faces[s], cube) : null) as any
	}
}
function compile_cube_face(face: CubeFace, cube: Cube): FiguraCubeFace {
	// Parse face and modify UVs
	if (face.rotation && face.rotation % 90 !== 0) {
		cube.select();
		throw 'Face on cube ' + cube.name + ' has invalid rotation - expected multiple of 90'
	}
	return {
		uv_min: [face.uv[0], face.uv[1]],
		uv_max: [face.uv[2], face.uv[3]],
		rotation: (((face.rotation ?? 0) % 360 + 360) % 360) as any
	}
}

function compile_mesh(mesh: Mesh, absolute_parent_origin: FiguraVec3): FiguraMesh {
	
	// Process vertices, keep indices
	let vertices: FiguraMeshVertex[] = [];
	let indices: {[key: string]: number} = {};
	Object.keys(mesh.vertices).sort().forEach((vertKey, index) => {
		indices[vertKey] = index;
		vertices.push({
			pos: mesh.vertices[vertKey]
		});
	});

	// Return object
	return {
		origin: mesh.origin.slice().V3_subtract(absolute_parent_origin),
		rotation: mesh.rotation.slice() as ArrayVector3,
		vertices,
		faces: Object.keys(mesh.faces).sort().map(id => {
			let face = mesh.faces[id];
			let vertex_count = face.vertices.length;
			if (vertex_count < 3 || vertex_count > 4) {
				mesh.select();
				throw 'Figmodel mesh faces must have 3 or 4 vertices, but mesh "' + mesh.name + '" has a face with ' + vertex_count + ' vertices!';
			}
			return {
				vertices: face.vertices.map(vertKey => ({
					index: indices[vertKey],
					uv: face.uv[vertKey]!
				})) as (Tuple<FiguraMeshVertexInfo,3> | Tuple<FiguraMeshVertexInfo,4>) // Cast is okay because we asserted vertex_count was either 3 or 4.
			};
		})
	}
}
