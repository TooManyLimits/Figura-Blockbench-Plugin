
import { compile_figura_data } from './compile';
import { deleteLater, FILE_EXTENSION, PLUGIN_ID } from './figura'
import { parse_figura_data } from './parse';

// Create the Figura format instance.
// This also saves it in the global variable Formats.
export function create_format() {
	let format = deleteLater(new ModelFormat(PLUGIN_ID, {
		id: PLUGIN_ID,
		icon: 'accessibility_new',
		name: 'Figura Model',
		description: 'Model for the Figura mod',
		category: 'minecraft',
		target: ['Figura'],
		show_on_start_screen: true,

		box_uv: true,
		optional_box_uv: true,
		single_texture: false,
		per_group_texture: true,
		per_texture_uv_size: true,
		model_identifier: false,
		legacy_editable_file_name: false,
		parent_model_id: false,
		vertex_color_ambient_occlusion: false,
		animated_textures: false,
		bone_rig: true,
		centered_grid: true,
		rotate_cubes: true,
		stretch_cubes: true,
		integer_size: false,
		meshes: true,
		texture_meshes: false,
		locators: true,
		rotation_limit: false,
		rotation_snap: false,
		uv_rotation: true,
		java_face_properties: false,
		select_texture_for_particles: false,
		bone_binding_expression: false,
		animation_files: false,
		texture_folder: false,
		image_editor: false,
		edit_mode: true,
		paint_mode: true,
		display_mode: true,
		animation_mode: true,
		pose_mode: false,
		animation_controllers: false,
		box_uv_float_size: true,
		java_cube_shading_properties: false,
		cullfaces: true,
		render_sides: 'front',
		cube_size_limiter: undefined,

		codec: deleteLater(new Codec(PLUGIN_ID, {
			name: "Figura Model",
			extension: FILE_EXTENSION,
			remember: true,
			// Loading from figura data?
			load_filter: {
				extensions: [FILE_EXTENSION],
				type: 'json',
			},
			parse(data, path, add) {
				try {
					if (add) throw 'Tried to parse figmodel with "add" param? Not sure what this is, please tell Figura devs about this!';
					parse_figura_data(data);
					Canvas.updateAll();
					Validator.validate();
					Project!.loadEditorState();
				} catch (error: any) {
					if (error instanceof TypeError) {
						console.error(error);
						error = 'Bug during parsing: "' + error.message + '". Malformed .figmodel file? Likely a bug in the plugin, please report to devs!';
					}
					Blockbench.showMessageBox({
						title: 'Error during figmodel import!',
						message: error,
					});
				}
			},
			// Compile operation might throw an error!
			compile() { return JSON.stringify(compile_figura_data()); },
			// Custom export, just the same as regular export except does try-catch error handling on compile().
			async export(this: Codec) {
				if (Object.keys(this.export_options).length) {
					let result = await this.promptExportOptions();
					if (result === null) return;
				}
				try {
					let compiled = this.compile(this.getExportOptions());
					Blockbench.export({
						resource_id: 'model',
						type: this.name,
						extensions: [this.extension],
						name: this.fileName(),
						startpath: this.startPath(),
						content: compiled,
						custom_writer: isApp ? (a, b) => this.write(a, b) : undefined,
					}, path => this.afterDownload(path))
				} catch (error: any) {
					Blockbench.showMessageBox({
						title: 'Error during figmodel export!',
						message: error
					});
				}
			},
			export_action: deleteLater(new Action('export_figura', {
				category: 'file',
				condition: { formats: [PLUGIN_ID] },
				click() {
					Format.codec?.export();
				}
			}))
		})),

		onActivation() {},
		onDeactivation() {}
	}));

	// Finalize structure and add export action to menu
	format.codec!.format = format;
	MenuBar.addAction(format.codec!.export_action!, 'file.export.0');

}

