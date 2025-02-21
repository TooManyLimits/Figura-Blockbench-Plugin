/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/compile.ts":
/*!************************!*\
  !*** ./src/compile.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   compile_figura_data: () => (/* binding */ compile_figura_data)
/* harmony export */ });
// Compile the global data in the project into a FiguraData.
// Can throw a string error for display.
function compile_figura_data() {
    // Generate groups!
    let parts = Project.outliner
        .filter(part => part instanceof Group)
        .map(group => compile_group(group, [0, 0, 0]));
    // Cubes or meshes are not currently allowed at the top level, because they're not in a group, so cannot have a texture index.
    for (var node of Project.outliner) {
        if (node instanceof Cube || node instanceof Mesh) {
            node.select();
            throw 'Top-level cubes and meshes, like "' + node.name + '", are not supported yet! For now, they must be wrapped in a group.';
        }
    }
    // Fetch item display data
    let display_contexts = ['none', 'thirdperson_lefthand', 'thirdperson_righthand', 'firstperson_lefthand', 'firstperson_righthand', 'head', 'gui', 'ground', 'fixed'];
    let item_display_data = {};
    for (var display_context of display_contexts) {
        let settings = Project === null || Project === void 0 ? void 0 : Project.display_settings[display_context];
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
            name: "", origin: [0, 0, 0], rotation: [0, 0, 0], children: parts, cubes: [], meshes: []
        },
        textures: Texture.all.map(tex => ({
            name: tex.name,
            path: tex.path,
            uv_size: [tex.uv_width, tex.uv_height],
            vanilla_texture_override: tex.vanilla_texture_override,
            png_bytes_base64: tex.getBase64()
        })),
        item_display_data
    };
}
function compile_group(group, absolute_parent_origin) {
    // Fetch the texture on this group, if any.
    let texture_index = undefined;
    if (group.texture) {
        texture_index = Texture.all.findIndex(tex => tex.uuid === group.texture);
        if (texture_index === -1)
            texture_index = undefined;
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
        throw 'Group "' + group.name + '" does not have a texture applied!\nDue to a Blockbench bug, cubes might appear to have a texture but their *group* does not.\nRight-click the *group* and select the texture!';
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
    };
}
function compile_cube(cube, absolute_parent_origin) {
    return {
        origin: cube.origin.slice().V3_subtract(absolute_parent_origin),
        rotation: cube.rotation.slice(),
        from: cube.from.slice().V3_subtract(absolute_parent_origin),
        to: cube.to.slice().V3_subtract(absolute_parent_origin),
        inflate: [cube.inflate, cube.inflate, cube.inflate],
        // Order of faces is important! See definition of FiguraCube
        faces: ['west', 'east', 'down', 'up', 'north', 'south']
            .map(s => cube.faces[s] ? compile_cube_face(cube.faces[s], cube) : null)
    };
}
function compile_cube_face(face, cube) {
    var _a;
    // Parse face and modify UVs
    if (face.rotation && face.rotation % 90 !== 0) {
        cube.select();
        throw 'Face on cube ' + cube.name + ' has invalid rotation - expected multiple of 90';
    }
    return {
        uv_min: [face.uv[0], face.uv[1]],
        uv_max: [face.uv[2], face.uv[3]],
        rotation: ((((_a = face.rotation) !== null && _a !== void 0 ? _a : 0) % 360 + 360) % 360)
    };
}
function compile_mesh(mesh, absolute_parent_origin) {
    // Process vertices, keep indices
    let vertices = [];
    let indices = {};
    Object.keys(mesh.vertices).sort().forEach((vertKey, index) => {
        indices[vertKey] = index;
        vertices.push({
            pos: mesh.vertices[vertKey]
        });
    });
    // Return object
    return {
        origin: mesh.origin.slice().V3_subtract(absolute_parent_origin),
        rotation: mesh.rotation.slice(),
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
                    uv: face.uv[vertKey]
                })) // Cast is okay because we asserted vertex_count was either 3 or 4.
            };
        })
    };
}


/***/ }),

/***/ "./src/features/vanilla_roots.ts":
/*!***************************************!*\
  !*** ./src/features/vanilla_roots.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup_vanilla_roots: () => (/* binding */ setup_vanilla_roots)
/* harmony export */ });
/* harmony import */ var _figura__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../figura */ "./src/figura.ts");

// Set up vanilla root functionality.
function setup_vanilla_roots() {
    var _a, _b, _c;
    // 2 properties on groups, for what the vanilla root is, and whether to replace.
    (0,_figura__WEBPACK_IMPORTED_MODULE_0__.deleteLater)(new Property(Group, 'string', 'vanilla_root', { condition: { formats: [_figura__WEBPACK_IMPORTED_MODULE_0__.PLUGIN_ID] } }));
    (0,_figura__WEBPACK_IMPORTED_MODULE_0__.deleteLater)(new Property(Group, 'boolean', 'replace_vanilla_root', { condition: { formats: [_figura__WEBPACK_IMPORTED_MODULE_0__.PLUGIN_ID] } }));
    // Display action for current root, and click to change.
    let displayCurrent = (0,_figura__WEBPACK_IMPORTED_MODULE_0__.deleteLater)(new Action('figura_current_vanilla_root', {
        name: 'No vanilla root selected',
        click() {
            oneGroup(group => {
                Blockbench.textPrompt('Type a vanilla root manually:', group.vanilla_root || '', given => {
                    group.vanilla_root = given || undefined;
                });
            });
        }
    }));
    // Actions for setting these values.
    let chooseRoot = (0,_figura__WEBPACK_IMPORTED_MODULE_0__.deleteLater)(new Action('figura_choose_vanilla_root', {
        name: 'Figura: Vanilla Root',
        description: 'Choose which vanilla root this part will follow. Works in vanilla/ folder only.',
        icon: 'accessibility_new',
        category: 'edit',
        condition: {
            formats: [_figura__WEBPACK_IMPORTED_MODULE_0__.PLUGIN_ID],
            method() {
                return !!oneGroup(group => {
                    let success = group.parent === 'root';
                    // Cursed condition with side effects... needed to change the name.
                    if (success)
                        displayCurrent.setName(group.vanilla_root ?
                            'Current: \"' + group.vanilla_root + '\"' :
                            'No vanilla root selected');
                    return success;
                });
            }
        },
        children: [displayCurrent, ...expand_parts_tree(SUPPORTED_PARTS)],
        click() { }
    }));
    let replaceRoot = (0,_figura__WEBPACK_IMPORTED_MODULE_0__.deleteLater)(new Action('figura_replace_vanilla_root', {
        name: 'Figura: Replace Vanilla Root',
        description: 'Enable this to replace the vanilla part instead of rendering with it.',
        icon: 'check_box_outline_blank',
        condition: {
            formats: [_figura__WEBPACK_IMPORTED_MODULE_0__.PLUGIN_ID],
            method() {
                return !!oneGroup(group => {
                    let success = group.parent === 'root' && group.vanilla_root;
                    // Cursed condition with side effects... needed to change the icon.
                    if (success)
                        replaceRoot.setIcon(group.replace_vanilla_root ? 'check_box' : 'check_box_outline_blank');
                    return success;
                });
            }
        },
        click() {
            oneGroup(group => group.replace_vanilla_root = !group.replace_vanilla_root);
        }
    }));
    // Add actions to group menu.
    (_a = Group.prototype.menu) === null || _a === void 0 ? void 0 : _a.structure.push(new MenuSeparator()); // Separator before figura stuff
    (_b = Group.prototype.menu) === null || _b === void 0 ? void 0 : _b.addAction(chooseRoot);
    (_c = Group.prototype.menu) === null || _c === void 0 ? void 0 : _c.addAction(replaceRoot);
}
// Helpers because multi_selected and first_selected and properties are annoying
function oneGroup(func) {
    if (Group.multi_selected.length === 1) {
        return func(Group.first_selected);
    }
    else {
        return undefined;
    }
}
function expand_parts_tree(parts, path = '') {
    return parts.map(part => {
        if (part === null) {
            return new MenuSeparator();
        }
        else if (typeof part === 'string') {
            return (0,_figura__WEBPACK_IMPORTED_MODULE_0__.deleteLater)(new Action('figura_vanilla_root_selector_' + part, {
                name: part,
                click() {
                    oneGroup(group => group.vanilla_root = part);
                }
            }));
        }
        else {
            let newPath = path + '_' + part.name.toLowerCase().replace(' ', '_');
            return (0,_figura__WEBPACK_IMPORTED_MODULE_0__.deleteLater)(new Action('figura_vanilla_root_selector_' + newPath, {
                name: part.name,
                children: expand_parts_tree(part.children, newPath),
                click() { }
            }));
        }
    });
}
const SUPPORTED_PARTS = [
    {
        name: 'Player',
        children: [
            'FIGURA_HEAD',
            'FIGURA_BODY',
            'FIGURA_LEFT_ARM',
            'FIGURA_RIGHT_ARM',
            'FIGURA_LEFT_LEG',
            'FIGURA_RIGHT_LEG',
            'FIGURA_CAPE',
            null,
            {
                name: 'Skin Outer Layer',
                children: [
                    'FIGURA_HAT',
                    'FIGURA_JACKET',
                    'FIGURA_LEFT_SLEEVE',
                    'FIGURA_RIGHT_SLEEVE',
                    'FIGURA_LEFT_PANTS',
                    'FIGURA_RIGHT_PANTS',
                ]
            },
            {
                name: 'Armor',
                children: [
                    {
                        name: 'Inner Layer',
                        children: [
                            'FIGURA_ARMOR_HEAD_INNER',
                            'FIGURA_ARMOR_HAT_INNER',
                            'FIGURA_ARMOR_BODY_INNER',
                            'FIGURA_ARMOR_LEFT_ARM_INNER',
                            'FIGURA_ARMOR_RIGHT_ARM_INNER',
                            'FIGURA_ARMOR_LEFT_LEG_INNER',
                            'FIGURA_ARMOR_RIGHT_LEG_INNER',
                        ]
                    },
                    {
                        name: 'Outer Layer',
                        children: [
                            'FIGURA_ARMOR_HEAD_OUTER',
                            'FIGURA_ARMOR_HAT_OUTER',
                            'FIGURA_ARMOR_BODY_OUTER',
                            'FIGURA_ARMOR_LEFT_ARM_OUTER',
                            'FIGURA_ARMOR_RIGHT_ARM_OUTER',
                            'FIGURA_ARMOR_LEFT_LEG_OUTER',
                            'FIGURA_ARMOR_RIGHT_LEG_OUTER',
                        ]
                    },
                    {
                        name: 'Baby',
                        children: [
                            {
                                name: 'Inner Layer',
                                children: [
                                    'FIGURA_ARMOR_HEAD_INNER_BABY',
                                    'FIGURA_ARMOR_HAT_INNER_BABY',
                                    'FIGURA_ARMOR_BODY_INNER_BABY',
                                    'FIGURA_ARMOR_LEFT_ARM_INNER_BABY',
                                    'FIGURA_ARMOR_RIGHT_ARM_INNER_BABY',
                                    'FIGURA_ARMOR_LEFT_LEG_INNER_BABY',
                                    'FIGURA_ARMOR_RIGHT_LEG_INNER_BABY',
                                ]
                            },
                            {
                                name: 'Outer Layer',
                                children: [
                                    'FIGURA_ARMOR_HEAD_OUTER_BABY',
                                    'FIGURA_ARMOR_HAT_OUTER_BABY',
                                    'FIGURA_ARMOR_BODY_OUTER_BABY',
                                    'FIGURA_ARMOR_LEFT_ARM_OUTER_BABY',
                                    'FIGURA_ARMOR_RIGHT_ARM_OUTER_BABY',
                                    'FIGURA_ARMOR_LEFT_LEG_OUTER_BABY',
                                    'FIGURA_ARMOR_RIGHT_LEG_OUTER_BABY',
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                name: 'Elytra',
                children: [
                    'FIGURA_LEFT_ELYTRA',
                    'FIGURA_RIGHT_ELYTRA'
                ]
            },
            {
                name: 'Trident Attack',
                children: [
                    'FIGURA_SPIN_ATTACK_1',
                    'FIGURA_SPIN_ATTACK_2',
                ]
            },
            {
                name: 'Stuck Arrows',
                children: [
                    'FIGURA_STUCK_ARROW_1',
                    'FIGURA_STUCK_ARROW_2',
                    'FIGURA_STUCK_ARROW_BACK'
                ]
            },
            {
                name: 'Stuck Bee Stingers',
                children: [
                    'FIGURA_STUCK_BEE_STINGER_1',
                    'FIGURA_STUCK_BEE_STINGER_2'
                ]
            }
        ]
    }
];


/***/ }),

/***/ "./src/features/vanilla_texture_override.ts":
/*!**************************************************!*\
  !*** ./src/features/vanilla_texture_override.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup_vanilla_texture_override: () => (/* binding */ setup_vanilla_texture_override)
/* harmony export */ });
/* harmony import */ var _figura__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../figura */ "./src/figura.ts");

function setup_vanilla_texture_override() {
    (0,_figura__WEBPACK_IMPORTED_MODULE_0__.deleteLater)(new Property(Texture, 'string', 'vanilla_texture_override', { condition: { formats: [_figura__WEBPACK_IMPORTED_MODULE_0__.PLUGIN_ID] } }));
    Texture.prototype.menu.addAction((0,_figura__WEBPACK_IMPORTED_MODULE_0__.deleteLater)(new Action('figura_vanilla_texture_override', {
        name: "Figura: Vanilla Texture Override",
        description: "Give this texture a vanilla override. In-game, this texture will be replaced with the path you type.",
        icon: "deployed_code",
        condition: () => !!Texture.selected,
        click() {
            let tex = Texture.selected;
            tex && Blockbench.textPrompt("Type a texture path. Example: \"textures/block/oak_planks.png\"", tex.vanilla_texture_override || "", given => {
                tex.vanilla_texture_override = given;
            });
        }
    })));
}


/***/ }),

/***/ "./src/figura.ts":
/*!***********************!*\
  !*** ./src/figura.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FILE_EXTENSION: () => (/* binding */ FILE_EXTENSION),
/* harmony export */   PLUGIN_ID: () => (/* binding */ PLUGIN_ID),
/* harmony export */   defer: () => (/* binding */ defer),
/* harmony export */   deleteLater: () => (/* binding */ deleteLater)
/* harmony export */ });
/* harmony import */ var _format__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./format */ "./src/format.ts");
/* harmony import */ var _features_vanilla_roots__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./features/vanilla_roots */ "./src/features/vanilla_roots.ts");
/* harmony import */ var _features_vanilla_texture_override__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./features/vanilla_texture_override */ "./src/features/vanilla_texture_override.ts");



// Global constants
const PLUGIN_ID = 'figura';
const FILE_EXTENSION = 'figmodel';
// Track deletable objects.
// When creating an object you want to be deleted, wrap with deleteLater().
let deletables = [];
function deleteLater(x) {
    deletables.push(x);
    return x;
}
function defer(func) {
    deletables.push({ delete: func });
}
// Register the plugin
BBPlugin.register(PLUGIN_ID, {
    title: 'Figura Mod Integration',
    author: 'TooManyLimits',
    description: 'Integration with the Figura mod for Minecraft',
    icon: 'accessibility_new',
    tags: ['Minecraft: Java Edition'],
    variant: 'desktop',
    await_loading: true, // The plugin adds a format, so this must be true
    onload() {
        // Translate
        Language.addTranslations('en', {
            'action.export_figura': 'Export Figura Model'
        });
        // Hopefully this block will not be necessary in the future, because it just fixes Blockbench bugs.
        {
            // Make "texture" field used/saved
            deleteLater(new Property(Group, 'string', 'texture', { condition: () => Format.per_group_texture }));
            // Make it so moving a part will update texture faces
            let callback = () => Canvas.updateAllFaces();
            Blockbench.addListener('finish_edit', callback);
            defer(() => Blockbench.removeListener('finish_edit', callback));
        }
        (0,_features_vanilla_roots__WEBPACK_IMPORTED_MODULE_1__.setup_vanilla_roots)();
        (0,_features_vanilla_texture_override__WEBPACK_IMPORTED_MODULE_2__.setup_vanilla_texture_override)();
        (0,_format__WEBPACK_IMPORTED_MODULE_0__.create_format)();
    },
    // Delete all the deletable objects.
    onunload() {
        for (let v of deletables)
            v.delete();
        deletables = [];
    },
});


/***/ }),

/***/ "./src/format.ts":
/*!***********************!*\
  !*** ./src/format.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   create_format: () => (/* binding */ create_format)
/* harmony export */ });
/* harmony import */ var _compile__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./compile */ "./src/compile.ts");
/* harmony import */ var _figura__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./figura */ "./src/figura.ts");
/* harmony import */ var _parse__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./parse */ "./src/parse.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};



// Create the Figura format instance.
// This also saves it in the global variable Formats.
function create_format() {
    let format = (0,_figura__WEBPACK_IMPORTED_MODULE_1__.deleteLater)(new ModelFormat(_figura__WEBPACK_IMPORTED_MODULE_1__.PLUGIN_ID, {
        id: _figura__WEBPACK_IMPORTED_MODULE_1__.PLUGIN_ID,
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
        codec: (0,_figura__WEBPACK_IMPORTED_MODULE_1__.deleteLater)(new Codec(_figura__WEBPACK_IMPORTED_MODULE_1__.PLUGIN_ID, {
            name: "Figura Model",
            extension: _figura__WEBPACK_IMPORTED_MODULE_1__.FILE_EXTENSION,
            remember: true,
            // Loading from figura data?
            load_filter: {
                extensions: [_figura__WEBPACK_IMPORTED_MODULE_1__.FILE_EXTENSION],
                type: 'json',
            },
            parse(data, path, add) {
                try {
                    if (add)
                        throw 'Tried to parse figmodel with "add" param? Not sure what this is, please tell Figura devs about this!';
                    (0,_parse__WEBPACK_IMPORTED_MODULE_2__.parse_figura_data)(data);
                    Canvas.updateAll();
                    Validator.validate();
                    Project.loadEditorState();
                }
                catch (error) {
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
            compile() { return JSON.stringify((0,_compile__WEBPACK_IMPORTED_MODULE_0__.compile_figura_data)()); },
            // Custom export, just the same as regular export except does try-catch error handling on compile().
            export() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (Object.keys(this.export_options).length) {
                        let result = yield this.promptExportOptions();
                        if (result === null)
                            return;
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
                        }, path => this.afterDownload(path));
                    }
                    catch (error) {
                        Blockbench.showMessageBox({
                            title: 'Error during figmodel export!',
                            message: error
                        });
                    }
                });
            },
            export_action: (0,_figura__WEBPACK_IMPORTED_MODULE_1__.deleteLater)(new Action('export_figura', {
                category: 'file',
                condition: { formats: [_figura__WEBPACK_IMPORTED_MODULE_1__.PLUGIN_ID] },
                click() {
                    var _a;
                    (_a = Format.codec) === null || _a === void 0 ? void 0 : _a.export();
                }
            }))
        })),
        onActivation() { },
        onDeactivation() { }
    }));
    // Finalize structure and add export action to menu
    format.codec.format = format;
    MenuBar.addAction(format.codec.export_action, 'file.export.0');
}


/***/ }),

/***/ "./src/parse.ts":
/*!**********************!*\
  !*** ./src/parse.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   parse_figura_data: () => (/* binding */ parse_figura_data)
/* harmony export */ });
// Import the given figmodel into the project
function parse_figura_data(data) {
    Project.textures = checkArray(data.textures, 'Invalid figmodel - missing textures key')
        .map(texture => parseTexture(checkObject(texture, 'Invalid figmodel - texture must be an {object}')));
    Project.outliner = parseGroup(checkObject(data.part_data, 'Invalid figmodel - missing part_data key'), Project.textures, [0, 0, 0], true).children;
    if (data.item_display_data)
        Project.display_settings = parseItemDisplayData(checkObject(data.item_display_data, 'Invalid figmodel - item display data should be object'));
}
function parseTexture(obj) {
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
function parseGroup(obj, textures, absolute_parent_origin, toplevel = false) {
    let name = checkString(obj.name, 'Invalid figmodel - group has missing or invalid name');
    let origin = absolute_parent_origin.slice().V3_add(checkVec3(obj.origin, 'Invalid figmodel - group "' + name + '" has missing or invalid origin'));
    let texture = mapOptional(optInteger(obj.texture_index, 0, textures.length, 'Invalid figmodel - group "' + name + '" texture index must be a number in range'), i => textures[i]);
    let group = new Group({
        name,
        origin,
        rotation: checkVec3(obj.rotation, 'Invalid figmodel - group "' + name + '" has missing or invalid rotation'),
        texture: texture === null || texture === void 0 ? void 0 : texture.uuid,
        vanilla_root: optString(obj.vanilla_root, 'Invalid figmodel - group "' + name + '" vanilla_root should be optional string'),
        replace_vanilla_root: optBoolean(obj.replace_vanilla_root, 'Invalid figmodel - group "' + name + '" replace_vanilla_root should be optional boolean'),
        visibility: true,
    });
    if (!toplevel)
        group.init();
    // Add child groups, cubes, and meshes
    group.children = checkArray(obj.children, 'Invalid figmodel - group "' + name + '" has missing or invalid children')
        .map(child => parseGroup(checkObject(child, 'Invalid figmodel - group must be an {object}'), textures, origin));
    let cubes = checkArray(obj.cubes, 'Invalid figmodel - group "' + name + '" has missing or invalid cubes');
    let meshes = checkArray(obj.meshes, 'Invalid figmodel - group "' + name + '" has missing or invalid meshes');
    if (cubes.length !== 0 || meshes.length !== 0) {
        if (!texture)
            throw 'Invalid figmodel - group "' + name + '" has cubes or meshes, but does not have a texture';
        if (toplevel)
            throw 'Invalid figmodel - top-level group may not have cubes or meshes';
    }
    cubes.forEach(child => parseCube(checkObject(child, 'Invalid figmodel - cube must be an {object}'), origin).addTo(group));
    meshes.forEach(child => parseMesh(checkObject(child, 'Invalid figmodel - mesh must be an {object}'), origin).addTo(group));
    return group;
}
function parseCube(obj, absolute_parent_origin) {
    // Fetch main values, adjust from/to/origin from relative to absolute
    let from = checkVec3(obj.from, 'Invalid figmodel - cube has missing or invalid "from"').V3_add(absolute_parent_origin);
    let to = checkVec3(obj.to, 'Invalid figmodel - cube has missing or invalid "to"').V3_add(absolute_parent_origin);
    let origin = checkVec3(obj.origin, 'Invalid figmodel - cube has missing or invalid origin').V3_add(absolute_parent_origin);
    let rotation = checkVec3(obj.rotation, 'Invalid figmodel - cube has missing or invalid rotation');
    let inflate = 0;
    // If all elements of inflateCec are the same (Very common!) Then set the inflate value.
    // Otherwise, modify from/to directly.
    let inflateVec = checkVec3(obj.inflate, 'Invalid figmodel - cube has missing or invalid "inflate"');
    if (inflateVec.every(v => v === inflateVec[0])) {
        inflate = inflateVec[0];
    }
    else {
        from.V3_subtract(inflateVec);
        to.V3_add(inflateVec);
    }
    // Fetch faces
    let faces = checkArray(obj.faces, 'Invalid figmodel - cube has missing or invalid "faces"');
    let bb_faces = {};
    ['west', 'east', 'down', 'up', 'north', 'south'].forEach((dir, i) => {
        if (faces[i] === null)
            return;
        let face = checkObject(faces[i], 'Invalid figmodel - cube face should be {object} or null');
        let uv_min = checkVec2(face.uv_min, 'Invalid figmodel - cube face has missing or invalid uv_min');
        let uv_max = checkVec2(face.uv_max, 'Invalid figmodel - cube face has missing or invalid uv_max');
        let rotation = face.rotation;
        if (rotation !== 0 && rotation !== 90 && rotation !== 180 && rotation !== 270)
            throw 'Invalid figmodel - cube face has invalid rotation. Expected 0, 90, 180, or 270, found ' + rotation;
        bb_faces[dir] = {
            uv: [uv_min[0], uv_min[1], uv_max[0], uv_max[1]],
            rotation,
        };
    });
    // Return
    return new Cube({
        name: 'cube',
        from, to, inflate,
        origin, rotation,
        faces: bb_faces,
        box_uv: false
    }).init();
}
function parseMesh(obj, absolute_parent_origin) {
    let origin = checkVec3(obj.origin, 'Invalid figmodel - mesh has missing or invalid origin').V3_add(absolute_parent_origin);
    let rotation = checkVec3(obj.rotation, 'Invalid figmodel - mesh has missing or invalid rotation');
    let mesh = new Mesh({
        name: 'mesh',
        origin, rotation,
        vertices: {}, // Need empty object, otherwise it automatically adds a cube
    });
    // Parse and add vertices
    let positions = [];
    let vertices = checkArray(obj.vertices, 'Invalid figmodel - mesh has missing or invalid vertices');
    for (let vert of vertices) {
        let pos = checkVec3(vert.pos, 'Invalid figmodel - mesh vertex has missing or invalid position');
        positions.push(pos);
    }
    let vert_names = mesh.addVertices(...positions);
    // Parse and add faces
    let bb_faces = [];
    let faces = checkArray(obj.faces, 'Invalid figmodel - mesh has missing or invalid faces');
    for (let face of faces) {
        let vertices = checkArray(face.vertices, 'Invalid figmodel - mesh face has missing or invalid vertices');
        if (vertices.length < 3 || vertices.length > 4)
            throw 'Invalid figmodel - mesh face should have 3 or 4 vertices, found ' + vertices.length;
        let names = [];
        let uv = {};
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
    return mesh.init();
}
const contexts = ['none', 'thirdperson_lefthand', 'thirdperson_righthand', 'firstperson_lefthand', 'firstperson_righthand', 'head', 'gui', 'ground', 'fixed'];
function parseItemDisplayData(data) {
    let result = {};
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
function mapOptional(item, mapper) {
    return item === undefined ? undefined : mapper(item);
}
function checkObject(item, msg) {
    return (typeof item === 'object' && item !== null) ? item : err(msg);
}
// Min inclusive, max exclusive
function checkInteger(item, min, max, msg) {
    return (Number.isInteger(item) && item >= min && item < max) ? item : err(msg);
}
function optInteger(item, min, max, msg) {
    return item === undefined ? undefined : checkInteger(item, min, max, msg);
}
function checkString(item, msg) {
    return typeof item === 'string' ? item : err(msg);
}
function optString(item, msg) {
    return item === undefined ? undefined : checkString(item, msg);
}
function checkBoolean(item, msg) {
    return typeof item === 'boolean' ? item : err(msg);
}
function optBoolean(item, msg) {
    return item === undefined ? undefined : checkBoolean(item, msg);
}
function checkVec2(item, msg) {
    if (!Array.isArray(item))
        err(msg);
    if (item.length != 2)
        err(msg);
    if (!item.every(elem => typeof elem === 'number'))
        err(msg);
    return item.slice();
}
function checkVec3(item, msg) {
    if (!Array.isArray(item))
        err(msg);
    if (item.length != 3)
        err(msg);
    if (!item.every(elem => typeof elem === 'number'))
        err(msg);
    return item.slice();
}
function checkArray(item, msg) {
    return Array.isArray(item) ? item : err(msg);
}
function err(message) {
    throw message;
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/figura.ts");
/******/ 	
/******/ })()
;