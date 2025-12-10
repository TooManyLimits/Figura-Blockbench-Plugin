import { associate, mapValues } from "./figura";
import { FiguraAnim, FiguraCube, FiguraCubeFace, FiguraData, FiguraGroup, FiguraItemDisplayTransform, FiguraKeyframeHolder, FiguraKeyframeInterpolation, FiguraMesh, FiguraMeshFace, FiguraMeshVertex, FiguraMeshVertexInfo, FiguraTexture, FiguraVec2, FiguraVec3, FiguraVectorKeyframe, Tuple } from "./figura_data";

// Compile the global data in the project into a FiguraData.
// Can throw a string error for display.
export function compile_figura_data(): FiguraData {

	// Cubes or meshes are not currently allowed at the top level, because they're not in a group, so cannot have a texture index.
	for (var node of Project!.outliner) {
		if (node instanceof Cube || node instanceof Mesh) {
			node.select();
			throw 'Top-level cubes and meshes, like "' + node.name + '", are not supported yet! For now, they must be wrapped in a group.';
		}
	}

	// Generate groups!
	let roots = associate(
		Project!.outliner.filter(part => part instanceof Group), 
		group => [group.name, compile_group(group, [0,0,0])]
	);

	// Textures
	let textures: Record<string, FiguraTexture> = associate(Texture.all, tex => [tex.name, {
		path: tex.path,
		uv_size: [tex.uv_width, tex.uv_height],
		vanilla_texture_override: tex.vanilla_texture_override,
		png_bytes_base64: tex.getBase64()
	}]);

	// Animations
	let animations: { [name: string]: FiguraAnim } = {} 
	AnimationItem.all.forEach(anim => animations[anim.name] = compile_animation(anim))

	// Fetch item display data
	let item_display_data = mapValues(Project!.display_settings, (_, settings) => ({
		translation: settings.translation,
		rotation: settings.rotation,
		scale: settings.scale
	}));

	// Return.
	return {
		roots,
		textures,
		animations,
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

	let children_groups = associate(
		group.children.filter(node => node instanceof Group),
		group => [group.name, compile_group(group, absolute_origin)]
	);

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
		origin: absolute_origin.slice().V3_subtract(absolute_parent_origin),
		rotation: group.rotation,
		children: children_groups,
		mimic_part: group.mimic_part || undefined,
		texture_index,
		cubes: cubes,
		meshes: meshes,
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
			.map(s => cube.faces[s] && cube.faces[s].texture !== null ? compile_cube_face(cube.faces[s], cube) : null) as any
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

function compile_animation(anim: _Animation): FiguraAnim {

	let parts: { [path: string]: FiguraKeyframeHolder } = {}
	for (let uuid in anim.animators) {
		let animator = anim.animators[uuid]
		if (animator.keyframes && animator.keyframes.length && animator instanceof BoneAnimator) {
			// Compute group path
			var group: OutlinerNode = animator.getGroup()
			var path = group.name
			while (group.parent && group.parent !== 'root') {
				group = group.parent
				path = group.name + "/" + path
			}
			// Compile keyframes
			let keyframeHolder: FiguraKeyframeHolder = {
				origin: animator.position?.flatMap(kf => compile_vec3_keyframe(kf, anim.snapping)),
				rotation: animator.rotation?.flatMap(kf => compile_vec3_keyframe(kf, anim.snapping)),
				scale: animator.scale?.flatMap(kf => compile_vec3_keyframe(kf, anim.snapping))
			}
			// Store
			parts[path] = keyframeHolder
		}
	}

	return {
		length: anim.length,
		snapping: anim.snapping,
		parts,
		script_keyframes: [] // TODO
	}
}

// Because blockbench keyframes have a "pre" and a "post", one BB keyframe
// can compile into multiple figura keyframes.
function compile_vec3_keyframe(keyframe: _Keyframe, snapping: number | undefined): FiguraVectorKeyframe[] {

	// Time
	let time = snapping ? Math.round(keyframe.time * snapping) : keyframe.time

	// Interpolation
	let bbinterp = keyframe.interpolation
	let interpolation: FiguraKeyframeInterpolation;
	switch (bbinterp) {
		case 'linear':
		case 'catmullrom':
		case 'step':
			interpolation = bbinterp
			break
		case 'bezier':
			interpolation = {
				kind: 'bezier',
				left_time: keyframe.bezier_left_time,
				left_value: keyframe.bezier_left_value,
				right_time: keyframe.bezier_right_time,
				right_value: keyframe.bezier_right_value
			}
	}

	// Multiple data points (pre/post) turn into multiple keyframes in our format.
	return keyframe.data_points.map(datapoint => ({
		time,
		data: [datapoint.x, datapoint.y, datapoint.z],
		interpolation
	}))
}