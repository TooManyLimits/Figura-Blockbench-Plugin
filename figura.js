/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./figura.js":
/*!*******************!*\
  !*** ./figura.js ***!
  \*******************/
/***/ (() => {



/***/ }),

/***/ "./src/compile.ts":
/*!************************!*\
  !*** ./src/compile.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   compile_figura_data: () => (/* binding */ compile_figura_data)
/* harmony export */ });
/* harmony import */ var _figura__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./figura */ "./src/figura.ts");

// Compile the global data in the project into a FiguraData.
// Can throw a string error for display.
function compile_figura_data() {
    // Cubes or meshes are not currently allowed at the top level, because they're not in a group, so cannot have a texture index.
    for (var node of Project.outliner) {
        if (node instanceof Cube || node instanceof Mesh) {
            node.select();
            throw 'Top-level cubes and meshes, like "' + node.name + '", are not supported yet! For now, they must be wrapped in a group.';
        }
    }
    // Generate groups!
    let roots = (0,_figura__WEBPACK_IMPORTED_MODULE_0__.associate)(Project.outliner.filter(part => part instanceof Group), group => [group.name, compile_group(group, [0, 0, 0])]);
    // Textures
    let textures = (0,_figura__WEBPACK_IMPORTED_MODULE_0__.associate)(Texture.all, tex => [tex.name, {
            path: tex.path,
            uv_size: [tex.uv_width, tex.uv_height],
            vanilla_texture_override: tex.vanilla_texture_override,
            png_bytes_base64: tex.getBase64()
        }]);
    // Animations
    let animations = {};
    AnimationItem.all.forEach(anim => animations[anim.name] = compile_animation(anim));
    // Fetch item display data
    let item_display_data = (0,_figura__WEBPACK_IMPORTED_MODULE_0__.mapValues)(Project.display_settings, (_, settings) => ({
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
    let children_groups = (0,_figura__WEBPACK_IMPORTED_MODULE_0__.associate)(group.children.filter(node => node instanceof Group), group => [group.name, compile_group(group, absolute_origin)]);
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
        origin: absolute_origin.slice().V3_subtract(absolute_parent_origin),
        rotation: group.rotation,
        children: children_groups,
        mimic_part: group.mimic_part || undefined,
        texture_index,
        cubes: cubes,
        meshes: meshes,
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
            .map(s => cube.faces[s] && cube.faces[s].texture !== null ? compile_cube_face(cube.faces[s], cube) : null)
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
function compile_animation(anim) {
    var _a, _b, _c;
    let parts = {};
    for (let uuid in anim.animators) {
        let animator = anim.animators[uuid];
        if (animator.keyframes && animator.keyframes.length && animator instanceof BoneAnimator) {
            // Compute group path
            var group = animator.getGroup();
            var path = group.name;
            while (group.parent && group.parent !== 'root') {
                group = group.parent;
                path = group.name + "/" + path;
            }
            // Compile keyframes
            let keyframeHolder = {
                origin: (_a = animator.position) === null || _a === void 0 ? void 0 : _a.flatMap(kf => compile_vec3_keyframe(kf, anim.snapping)),
                rotation: (_b = animator.rotation) === null || _b === void 0 ? void 0 : _b.flatMap(kf => compile_vec3_keyframe(kf, anim.snapping)),
                scale: (_c = animator.scale) === null || _c === void 0 ? void 0 : _c.flatMap(kf => compile_vec3_keyframe(kf, anim.snapping))
            };
            // Store
            parts[path] = keyframeHolder;
        }
    }
    return {
        length: anim.length,
        snapping: anim.snapping,
        parts,
        script_keyframes: [] // TODO
    };
}
// Because blockbench keyframes have a "pre" and a "post", one BB keyframe
// can compile into multiple figura keyframes.
function compile_vec3_keyframe(keyframe, snapping) {
    // Time
    let time = snapping ? Math.round(keyframe.time * snapping) : keyframe.time;
    // Interpolation
    let bbinterp = keyframe.interpolation;
    let interpolation;
    switch (bbinterp) {
        case 'linear':
        case 'catmullrom':
        case 'step':
            interpolation = bbinterp;
            break;
        case 'bezier':
            interpolation = {
                kind: 'bezier',
                left_time: keyframe.bezier_left_time,
                left_value: keyframe.bezier_left_value,
                right_time: keyframe.bezier_right_time,
                right_value: keyframe.bezier_right_value
            };
    }
    // Multiple data points (pre/post) turn into multiple keyframes in our format.
    return keyframe.data_points.map(datapoint => ({
        time,
        data: [datapoint.x, datapoint.y, datapoint.z],
        interpolation
    }));
}


/***/ }),

/***/ "./src/features/mimic_parts.ts":
/*!*************************************!*\
  !*** ./src/features/mimic_parts.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup_mimic_parts: () => (/* binding */ setup_mimic_parts)
/* harmony export */ });
/* harmony import */ var _figura__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../figura */ "./src/figura.ts");

// Set up mimic part functionality.
function setup_mimic_parts() {
    var _a, _b;
    // New property on groups to store the current mimic part
    (0,_figura__WEBPACK_IMPORTED_MODULE_0__.deleteLater)(new Property(Group, 'string', 'mimic_part', { condition: { formats: [_figura__WEBPACK_IMPORTED_MODULE_0__.PLUGIN_ID] } }));
    // Display action for current mimic, and click to change.
    let displayCurrent = (0,_figura__WEBPACK_IMPORTED_MODULE_0__.deleteLater)(new Action('figura_current_mimic_part', {
        name: 'No mimic part selected',
        click() {
            oneGroup(group => {
                Blockbench.textPrompt('Type a part to mimic manually. Example: ENTITY/head', group.mimic_part || '', given => {
                    group.mimic_part = given || undefined;
                });
            });
        }
    }));
    // Actions for setting these values.
    let chooseMimicPart = (0,_figura__WEBPACK_IMPORTED_MODULE_0__.deleteLater)(new Action('figura_choose_mimic_part', {
        name: 'Figura: Mimic Part',
        description: 'Choose which vanilla part this part will mimic.',
        icon: 'accessibility_new',
        category: 'edit',
        condition: {
            formats: [_figura__WEBPACK_IMPORTED_MODULE_0__.PLUGIN_ID],
            method() {
                return !!oneGroup(group => {
                    // Cursed condition with side effects... needed to change the name.
                    displayCurrent.setName(group.mimic_part ?
                        'Current: \"' + group.mimic_part + '\"' :
                        'No mimic part selected');
                    return true;
                });
            }
        },
        children: [displayCurrent, ...expand_entities(SUPPORTED_MIMICS)],
        click() { }
    }));
    // Add actions to group menu.
    (_a = Group.prototype.menu) === null || _a === void 0 ? void 0 : _a.structure.push(new MenuSeparator()); // Separator before figura stuff
    (_b = Group.prototype.menu) === null || _b === void 0 ? void 0 : _b.addAction(chooseMimicPart);
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
function expand_entities(entities) {
    return entities.map(entity => (0,_figura__WEBPACK_IMPORTED_MODULE_0__.deleteLater)(new Action('figura.mimic_part_selector.' + entity[0], {
        name: entity[0],
        children: expand_model_parts('figura.mimic_part_selector.' + entity[0], entity[1]),
        click() { }
    })));
}
// Underscore means it's not clickable and is just a subfolder for organization
function expand_model_parts(action_prefix, parts) {
    return parts.map(part => {
        if (typeof part === 'string') {
            return (0,_figura__WEBPACK_IMPORTED_MODULE_0__.deleteLater)(new Action(action_prefix + '.' + part, {
                name: part,
                click() { oneGroup(group => group.mimic_part = part); }
            }));
        }
        else {
            const action = (0,_figura__WEBPACK_IMPORTED_MODULE_0__.deleteLater)(new Action(action_prefix + '.' + part[0], {
                name: part[0].startsWith('_') ? part[0].substring(1) : part[0], // Strip underscore
                children: expand_model_parts(action_prefix + '.' + part[0], part[1]),
                click: part[0].startsWith('_') ? () => { } : () => { oneGroup(group => group.mimic_part = part[0]); }
            }));
            // Manually add event listener, since it normally doesn't work on actions with children
            if (!part[0].startsWith('_')) {
                action.menu_node.addEventListener('click', event => {
                    if (event.target !== action.menu_node)
                        return;
                    action.trigger(event);
                    open_menu === null || open_menu === void 0 ? void 0 : open_menu.hide(); // Hide the menu, since that also doesn't happen automatically when clicking action with children
                });
            }
            return action;
        }
    });
}
const PLAYER = [
    ['head', ['hat']],
    ['body', ['jacket', 'cape']],
    ['left_arm', ['left_sleeve']],
    ['right_arm', ['right_sleeve']],
    ['left_leg', ['left_pants']],
    ['right_leg', ['right_pants']],
    ['_ELYTRA', [
            'left_wing',
            'right_wing'
        ]],
];
const SUPPORTED_MIMICS = [
    ['Player', PLAYER],
];


/***/ }),

/***/ "./src/features/vanilla_texture_override.ts":
/*!**************************************************!*\
  !*** ./src/features/vanilla_texture_override.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
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

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FILE_EXTENSION: () => (/* binding */ FILE_EXTENSION),
/* harmony export */   PLUGIN_ID: () => (/* binding */ PLUGIN_ID),
/* harmony export */   associate: () => (/* binding */ associate),
/* harmony export */   defer: () => (/* binding */ defer),
/* harmony export */   deleteLater: () => (/* binding */ deleteLater),
/* harmony export */   forEachEntry: () => (/* binding */ forEachEntry),
/* harmony export */   groupAdjacent: () => (/* binding */ groupAdjacent),
/* harmony export */   mapValues: () => (/* binding */ mapValues)
/* harmony export */ });
/* harmony import */ var _format__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./format */ "./src/format.ts");
/* harmony import */ var _features_mimic_parts__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./features/mimic_parts */ "./src/features/mimic_parts.ts");
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
// Util functions (todo maybe move to another file)
// Map values of a string-keyed record from V1 to V2. The key is also passed to the mapper func.
function mapValues(obj, func) {
    const result = {};
    for (const key in obj) {
        result[key] = func(key, obj[key]);
    }
    return result;
}
function forEachEntry(obj, func) {
    for (const key in obj) {
        func(key, obj[key]);
    }
}
// Convert a list of items into an association from name -> value
function associate(items, func) {
    const result = {};
    for (const item of items) {
        const [key, val] = func(item);
        result[key] = val;
    }
    return result;
}
// Group adjacent values by comparing their extracted keys
function groupAdjacent(items, key_extractor) {
    const result = [];
    var i = 0;
    while (i < items.length) {
        const key = key_extractor(items[i]);
        const nextArr = [items[i]];
        i++;
        while (i < items.length && key_extractor(items[i]) === key) {
            nextArr.push(items[i]);
            i++;
        }
        result.push(nextArr);
    }
    return result;
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
        (0,_features_mimic_parts__WEBPACK_IMPORTED_MODULE_1__.setup_mimic_parts)();
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

/***/ "./src/figura_data.guard.ts":
/*!**********************************!*\
  !*** ./src/figura_data.guard.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isFiguraAnim: () => (/* binding */ isFiguraAnim),
/* harmony export */   isFiguraCube: () => (/* binding */ isFiguraCube),
/* harmony export */   isFiguraCubeFace: () => (/* binding */ isFiguraCubeFace),
/* harmony export */   isFiguraData: () => (/* binding */ isFiguraData),
/* harmony export */   isFiguraGroup: () => (/* binding */ isFiguraGroup),
/* harmony export */   isFiguraItemDisplayData: () => (/* binding */ isFiguraItemDisplayData),
/* harmony export */   isFiguraItemDisplayTransform: () => (/* binding */ isFiguraItemDisplayTransform),
/* harmony export */   isFiguraKeyframeHolder: () => (/* binding */ isFiguraKeyframeHolder),
/* harmony export */   isFiguraKeyframeInterpolation: () => (/* binding */ isFiguraKeyframeInterpolation),
/* harmony export */   isFiguraMesh: () => (/* binding */ isFiguraMesh),
/* harmony export */   isFiguraMeshFace: () => (/* binding */ isFiguraMeshFace),
/* harmony export */   isFiguraMeshVertex: () => (/* binding */ isFiguraMeshVertex),
/* harmony export */   isFiguraMeshVertexInfo: () => (/* binding */ isFiguraMeshVertexInfo),
/* harmony export */   isFiguraScriptKeyframe: () => (/* binding */ isFiguraScriptKeyframe),
/* harmony export */   isFiguraTexture: () => (/* binding */ isFiguraTexture),
/* harmony export */   isFiguraVec2: () => (/* binding */ isFiguraVec2),
/* harmony export */   isFiguraVec3: () => (/* binding */ isFiguraVec3),
/* harmony export */   isFiguraVectorKeyframe: () => (/* binding */ isFiguraVectorKeyframe)
/* harmony export */ });
function isFiguraData(obj) {
    const typedObj = obj;
    return ((typedObj !== null &&
        typeof typedObj === "object" ||
        typeof typedObj === "function") &&
        (typeof typedObj["roots"] === "undefined" ||
            (typedObj["roots"] !== null &&
                typeof typedObj["roots"] === "object" ||
                typeof typedObj["roots"] === "function") &&
                Object.entries(typedObj["roots"])
                    .every(([key, value]) => (isFiguraGroup(value) &&
                    typeof key === "string"))) &&
        (typeof typedObj["textures"] === "undefined" ||
            (typedObj["textures"] !== null &&
                typeof typedObj["textures"] === "object" ||
                typeof typedObj["textures"] === "function") &&
                Object.entries(typedObj["textures"])
                    .every(([key, value]) => (isFiguraTexture(value) &&
                    typeof key === "string"))) &&
        (typeof typedObj["animations"] === "undefined" ||
            (typedObj["animations"] !== null &&
                typeof typedObj["animations"] === "object" ||
                typeof typedObj["animations"] === "function") &&
                Object.entries(typedObj["animations"])
                    .every(([key, value]) => (isFiguraAnim(value) &&
                    typeof key === "string"))) &&
        (typeof typedObj["item_display_data"] === "undefined" ||
            isFiguraItemDisplayData(typedObj["item_display_data"])));
}
function isFiguraGroup(obj) {
    const typedObj = obj;
    return ((typedObj !== null &&
        typeof typedObj === "object" ||
        typeof typedObj === "function") &&
        (typeof typedObj["origin"] === "undefined" ||
            isFiguraVec3(typedObj["origin"])) &&
        (typeof typedObj["rotation"] === "undefined" ||
            isFiguraVec3(typedObj["rotation"])) &&
        (typeof typedObj["children"] === "undefined" ||
            (typedObj["children"] !== null &&
                typeof typedObj["children"] === "object" ||
                typeof typedObj["children"] === "function") &&
                Object.entries(typedObj["children"])
                    .every(([key, value]) => (isFiguraGroup(value) &&
                    typeof key === "string"))) &&
        (typeof typedObj["mimic_part"] === "undefined" ||
            typeof typedObj["mimic_part"] === "string") &&
        (typeof typedObj["texture_index"] === "undefined" ||
            typeof typedObj["texture_index"] === "number") &&
        (typeof typedObj["cubes"] === "undefined" ||
            Array.isArray(typedObj["cubes"]) &&
                typedObj["cubes"].every((e) => isFiguraCube(e))) &&
        (typeof typedObj["meshes"] === "undefined" ||
            Array.isArray(typedObj["meshes"]) &&
                typedObj["meshes"].every((e) => isFiguraMesh(e))));
}
function isFiguraCube(obj) {
    const typedObj = obj;
    return ((typedObj !== null &&
        typeof typedObj === "object" ||
        typeof typedObj === "function") &&
        (typeof typedObj["origin"] === "undefined" ||
            isFiguraVec3(typedObj["origin"])) &&
        (typeof typedObj["rotation"] === "undefined" ||
            isFiguraVec3(typedObj["rotation"])) &&
        isFiguraVec3(typedObj["from"]) &&
        isFiguraVec3(typedObj["to"]) &&
        (typeof typedObj["inflate"] === "undefined" ||
            isFiguraVec3(typedObj["inflate"])) &&
        Array.isArray(typedObj["faces"]) &&
        (typedObj["faces"][0] === null ||
            isFiguraCubeFace(typedObj["faces"][0])) &&
        (typedObj["faces"][1] === null ||
            isFiguraCubeFace(typedObj["faces"][1])) &&
        (typedObj["faces"][2] === null ||
            isFiguraCubeFace(typedObj["faces"][2])) &&
        (typedObj["faces"][3] === null ||
            isFiguraCubeFace(typedObj["faces"][3])) &&
        (typedObj["faces"][4] === null ||
            isFiguraCubeFace(typedObj["faces"][4])) &&
        (typedObj["faces"][5] === null ||
            isFiguraCubeFace(typedObj["faces"][5])));
}
function isFiguraCubeFace(obj) {
    const typedObj = obj;
    return ((typedObj !== null &&
        typeof typedObj === "object" ||
        typeof typedObj === "function") &&
        isFiguraVec2(typedObj["uv_min"]) &&
        isFiguraVec2(typedObj["uv_max"]) &&
        (typeof typedObj["rotation"] === "undefined" ||
            typedObj["rotation"] === 0 ||
            typedObj["rotation"] === 90 ||
            typedObj["rotation"] === 180 ||
            typedObj["rotation"] === 270));
}
function isFiguraMesh(obj) {
    const typedObj = obj;
    return ((typedObj !== null &&
        typeof typedObj === "object" ||
        typeof typedObj === "function") &&
        (typeof typedObj["origin"] === "undefined" ||
            isFiguraVec3(typedObj["origin"])) &&
        (typeof typedObj["rotation"] === "undefined" ||
            isFiguraVec3(typedObj["rotation"])) &&
        Array.isArray(typedObj["vertices"]) &&
        typedObj["vertices"].every((e) => isFiguraMeshVertex(e)) &&
        Array.isArray(typedObj["faces"]) &&
        typedObj["faces"].every((e) => isFiguraMeshFace(e)));
}
function isFiguraMeshVertex(obj) {
    const typedObj = obj;
    return ((typedObj !== null &&
        typeof typedObj === "object" ||
        typeof typedObj === "function") &&
        isFiguraVec3(typedObj["pos"]));
}
function isFiguraMeshFace(obj) {
    const typedObj = obj;
    return ((typedObj !== null &&
        typeof typedObj === "object" ||
        typeof typedObj === "function") &&
        (Array.isArray(typedObj["vertices"]) &&
            isFiguraMeshVertexInfo(typedObj["vertices"][0]) &&
            isFiguraMeshVertexInfo(typedObj["vertices"][1]) &&
            isFiguraMeshVertexInfo(typedObj["vertices"][2]) ||
            Array.isArray(typedObj["vertices"]) &&
                isFiguraMeshVertexInfo(typedObj["vertices"][0]) &&
                isFiguraMeshVertexInfo(typedObj["vertices"][1]) &&
                isFiguraMeshVertexInfo(typedObj["vertices"][2]) &&
                isFiguraMeshVertexInfo(typedObj["vertices"][3])));
}
function isFiguraMeshVertexInfo(obj) {
    const typedObj = obj;
    return ((typedObj !== null &&
        typeof typedObj === "object" ||
        typeof typedObj === "function") &&
        typeof typedObj["index"] === "number" &&
        isFiguraVec2(typedObj["uv"]));
}
function isFiguraTexture(obj) {
    const typedObj = obj;
    return ((typedObj !== null &&
        typeof typedObj === "object" ||
        typeof typedObj === "function") &&
        (typeof typedObj["path"] === "undefined" ||
            typeof typedObj["path"] === "string") &&
        isFiguraVec2(typedObj["uv_size"]) &&
        (typeof typedObj["vanilla_texture_override"] === "undefined" ||
            typeof typedObj["vanilla_texture_override"] === "string") &&
        typeof typedObj["png_bytes_base64"] === "string");
}
function isFiguraItemDisplayData(obj) {
    const typedObj = obj;
    return ((typedObj !== null &&
        typeof typedObj === "object" ||
        typeof typedObj === "function") &&
        Object.entries(typedObj)
            .every(([key, value]) => (isFiguraItemDisplayTransform(value) &&
            typeof key === "string")));
}
function isFiguraItemDisplayTransform(obj) {
    const typedObj = obj;
    return ((typedObj !== null &&
        typeof typedObj === "object" ||
        typeof typedObj === "function") &&
        (typeof typedObj["translation"] === "undefined" ||
            isFiguraVec3(typedObj["translation"])) &&
        (typeof typedObj["rotation"] === "undefined" ||
            isFiguraVec3(typedObj["rotation"])) &&
        (typeof typedObj["scale"] === "undefined" ||
            isFiguraVec3(typedObj["scale"])));
}
function isFiguraAnim(obj) {
    const typedObj = obj;
    return ((typedObj !== null &&
        typeof typedObj === "object" ||
        typeof typedObj === "function") &&
        typeof typedObj["length"] === "number" &&
        (typeof typedObj["snapping"] === "undefined" ||
            typeof typedObj["snapping"] === "number") &&
        (typeof typedObj["strength"] === "undefined" ||
            typeof typedObj["strength"] === "number") &&
        (typeof typedObj["loop"] === "undefined" ||
            typedObj["loop"] === "once" ||
            typedObj["loop"] === "hold" ||
            typedObj["loop"] === "loop") &&
        (typeof typedObj["parts"] === "undefined" ||
            (typedObj["parts"] !== null &&
                typeof typedObj["parts"] === "object" ||
                typeof typedObj["parts"] === "function") &&
                Object.entries(typedObj["parts"])
                    .every(([key, value]) => (isFiguraKeyframeHolder(value) &&
                    typeof key === "string"))) &&
        (typeof typedObj["script_keyframes"] === "undefined" ||
            Array.isArray(typedObj["script_keyframes"]) &&
                typedObj["script_keyframes"].every((e) => isFiguraScriptKeyframe(e))));
}
function isFiguraKeyframeHolder(obj) {
    const typedObj = obj;
    return ((typedObj !== null &&
        typeof typedObj === "object" ||
        typeof typedObj === "function") &&
        (typeof typedObj["origin"] === "undefined" ||
            Array.isArray(typedObj["origin"]) &&
                typedObj["origin"].every((e) => isFiguraVectorKeyframe(e))) &&
        (typeof typedObj["rotation"] === "undefined" ||
            Array.isArray(typedObj["rotation"]) &&
                typedObj["rotation"].every((e) => isFiguraVectorKeyframe(e))) &&
        (typeof typedObj["scale"] === "undefined" ||
            Array.isArray(typedObj["scale"]) &&
                typedObj["scale"].every((e) => isFiguraVectorKeyframe(e))));
}
function isFiguraScriptKeyframe(obj) {
    const typedObj = obj;
    return ((typedObj !== null &&
        typeof typedObj === "object" ||
        typeof typedObj === "function") &&
        typeof typedObj["time"] === "number" &&
        typeof typedObj["data"] === "string");
}
function isFiguraVectorKeyframe(obj) {
    const typedObj = obj;
    return ((typedObj !== null &&
        typeof typedObj === "object" ||
        typeof typedObj === "function") &&
        typeof typedObj["time"] === "number" &&
        Array.isArray(typedObj["data"]) &&
        (typeof typedObj["data"][0] === "string" ||
            typeof typedObj["data"][0] === "number") &&
        (typeof typedObj["data"][1] === "string" ||
            typeof typedObj["data"][1] === "number") &&
        (typeof typedObj["data"][2] === "string" ||
            typeof typedObj["data"][2] === "number") &&
        isFiguraKeyframeInterpolation(typedObj["interpolation"]));
}
function isFiguraKeyframeInterpolation(obj) {
    const typedObj = obj;
    return ((typedObj === "linear" ||
        typedObj === "catmullrom" ||
        typedObj === "step" ||
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
            typedObj["kind"] === "bezier" &&
            isFiguraVec3(typedObj["left_time"]) &&
            isFiguraVec3(typedObj["left_value"]) &&
            isFiguraVec3(typedObj["right_time"]) &&
            isFiguraVec3(typedObj["right_value"])));
}
function isFiguraVec2(obj) {
    const typedObj = obj;
    return (Array.isArray(typedObj) &&
        typeof typedObj[0] === "number" &&
        typeof typedObj[1] === "number");
}
function isFiguraVec3(obj) {
    const typedObj = obj;
    return (Array.isArray(typedObj) &&
        typeof typedObj[0] === "number" &&
        typeof typedObj[1] === "number" &&
        typeof typedObj[2] === "number");
}


/***/ }),

/***/ "./src/format.ts":
/*!***********************!*\
  !*** ./src/format.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   create_format: () => (/* binding */ create_format)
/* harmony export */ });
/* harmony import */ var _compile__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./compile */ "./src/compile.ts");
/* harmony import */ var _figura__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./figura */ "./src/figura.ts");
/* harmony import */ var _parse__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./parse */ "./src/parse.ts");



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
        locators: false,
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
        node_name_regex: undefined,
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
            async export() {
                if (Object.keys(this.export_options).length) {
                    let result = await this.promptExportOptions();
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

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   parse_figura_data: () => (/* binding */ parse_figura_data)
/* harmony export */ });
/* harmony import */ var _figura__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./figura */ "./src/figura.ts");
/* harmony import */ var _figura_data_guard__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./figura_data.guard */ "./src/figura_data.guard.ts");


// Import the given figmodel into the project
function parse_figura_data(data) {
    var _a, _b, _c;
    // Ensure data is a valid figmodel
    if (!(0,_figura_data_guard__WEBPACK_IMPORTED_MODULE_1__.isFiguraData)(data))
        err('Invalid figmodel. Likely a bug with exporter! Please send your figmodel file to the Figura dev team so we can check it out!');
    // Process fields
    (0,_figura__WEBPACK_IMPORTED_MODULE_0__.forEachEntry)((_a = data.textures) !== null && _a !== void 0 ? _a : {}, parseTexture);
    (0,_figura__WEBPACK_IMPORTED_MODULE_0__.forEachEntry)((_b = data.roots) !== null && _b !== void 0 ? _b : {}, (name, group) => parseGroup(name, group, Project.textures, undefined));
    (0,_figura__WEBPACK_IMPORTED_MODULE_0__.forEachEntry)((_c = data.animations) !== null && _c !== void 0 ? _c : {}, parseAnimation);
    // Add item display data (is this correct, to assign to the global var?)
    if (data.item_display_data)
        Project.display_settings = parseItemDisplayData(data.item_display_data);
}
function parseTexture(name, figuraTexture) {
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
function parseGroup(name, figuraGroup, textures, parent) {
    var _a, _b, _c, _d, _e, _f;
    let origin = ((_a = parent === null || parent === void 0 ? void 0 : parent.origin.slice()) !== null && _a !== void 0 ? _a : [0, 0, 0]).V3_add((_b = figuraGroup.origin) !== null && _b !== void 0 ? _b : [0, 0, 0]);
    if (figuraGroup.texture_index !== undefined) // 0 is falsy, so explicitly check for undefined
        checkInteger(figuraGroup.texture_index, 0, textures.length, 'Invalid figmodel - group "' + name + '" texture index must be a number in range');
    let texture = figuraGroup.texture_index !== undefined ? textures[figuraGroup.texture_index] : undefined;
    let group = new Group({
        name,
        origin,
        rotation: (_c = figuraGroup.rotation) !== null && _c !== void 0 ? _c : [0, 0, 0],
        texture: texture === null || texture === void 0 ? void 0 : texture.uuid,
        mimic_part: figuraGroup.mimic_part,
        visibility: true,
    });
    group.parent = parent !== null && parent !== void 0 ? parent : 'root';
    group.init(); // Calling group.init() while group.parent is undefined will cause an error :P
    group.addTo(parent);
    // Fetch/check child groups, cubes, and meshes
    let cubes = (_d = figuraGroup.cubes) !== null && _d !== void 0 ? _d : [];
    let meshes = (_e = figuraGroup.meshes) !== null && _e !== void 0 ? _e : [];
    // Verify texture exists if there are cubes/meshes
    if (cubes.length !== 0 || meshes.length !== 0) {
        if (!texture)
            err('Invalid figmodel - group "' + name + '" has cubes or meshes, but does not have a texture');
    }
    // Process
    (0,_figura__WEBPACK_IMPORTED_MODULE_0__.forEachEntry)((_f = figuraGroup.children) !== null && _f !== void 0 ? _f : {}, (childname, child) => parseGroup(childname, child, textures, group));
    cubes.forEach(cube => parseCube(cube, group));
    meshes.forEach(mesh => parseMesh(mesh, group));
    return group;
}
function parseCube(figuraCube, parent) {
    var _a, _b, _c;
    // Fetch main values, adjust from/to/origin from relative to absolute
    let from = figuraCube.from.V3_add(parent.origin);
    let to = figuraCube.to.V3_add(parent.origin);
    let origin = ((_a = figuraCube.origin) !== null && _a !== void 0 ? _a : [0, 0, 0]).V3_add(parent.origin);
    let rotation = (_b = figuraCube.rotation) !== null && _b !== void 0 ? _b : [0, 0, 0];
    let inflate = 0;
    // If all elements of inflateVec are the same (Very common!) Then set the inflate value.
    // Otherwise, modify from/to directly.
    let inflateVec = (_c = figuraCube.inflate) !== null && _c !== void 0 ? _c : [0, 0, 0];
    if (inflateVec.every(v => v === inflateVec[0])) {
        inflate = inflateVec[0];
    }
    else {
        from.V3_subtract(inflateVec);
        to.V3_add(inflateVec);
    }
    // Fetch faces
    let bb_faces = {};
    ['west', 'east', 'down', 'up', 'north', 'south'].forEach((dir, i) => {
        if (figuraCube.faces[i] === null) {
            bb_faces[dir] = {
                uv: [0, 0, 0, 0],
                texture: null,
                rotation: 0
            };
        }
        else {
            let face = figuraCube.faces[i];
            bb_faces[dir] = {
                uv: [face.uv_min[0], face.uv_min[1], face.uv_max[0], face.uv_max[1]],
                rotation: face.rotation,
            };
        }
    });
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
function parseMesh(figuraMesh, parent) {
    var _a, _b;
    let origin = ((_a = figuraMesh.origin) !== null && _a !== void 0 ? _a : [0, 0, 0]).V3_add(parent.origin);
    let rotation = (_b = figuraMesh.rotation) !== null && _b !== void 0 ? _b : [0, 0, 0];
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
    let positions = [];
    for (let vert of figuraMesh.vertices) {
        positions.push(vert.pos);
    }
    let vert_names = mesh.addVertices(...positions);
    // Parse and add faces
    let bb_faces = [];
    for (let face of figuraMesh.faces) {
        let names = [];
        let uv = {};
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
function parseItemDisplayData(data) {
    return (0,_figura__WEBPACK_IMPORTED_MODULE_0__.mapValues)(data, (context, transform) => {
        var _a, _b, _c;
        return new DisplaySlot(context, {
            translation: (_a = transform.translation) !== null && _a !== void 0 ? _a : [0, 0, 0],
            rotation: (_b = transform.rotation) !== null && _b !== void 0 ? _b : [0, 0, 0],
            scale: (_c = transform.scale) !== null && _c !== void 0 ? _c : [1, 1, 1],
            mirror: [false, false, false]
        });
    });
}
// Parse and add an animation from the given data
function parseAnimation(name, figuraAnim) {
    var _a;
    const anim = new Blockbench.Animation({
        name,
        length: figuraAnim.length,
        snapping: figuraAnim.snapping
    });
    (0,_figura__WEBPACK_IMPORTED_MODULE_0__.forEachEntry)((_a = figuraAnim.parts) !== null && _a !== void 0 ? _a : {}, (path, kfholder) => {
        var _a, _b, _c, _d;
        // Path is a slash-separated list of part names, starting from the model root.
        var items = Outliner.root;
        var part = null;
        for (const name of path.split('/')) {
            const child = (_a = items.find(it => it.name == name)) !== null && _a !== void 0 ? _a : err('Invalid figmodel - could not locate part with path "' + path + '"');
            if (child instanceof Group) {
                items = child.children;
                part = child;
            }
            else
                err('Invalid figmodel - animations can only refer to groups, but "' + path + '" does not.');
        }
        if (!part)
            err('Invalid figmodel - could not locate part with path "' + path + '"');
        // We now have the part. Parse keyframes.
        const animator = anim.getBoneAnimator(part);
        parseKeyframes(animator, 'position', (_b = kfholder.origin) !== null && _b !== void 0 ? _b : [], figuraAnim.snapping);
        parseKeyframes(animator, 'rotation', (_c = kfholder.rotation) !== null && _c !== void 0 ? _c : [], figuraAnim.snapping);
        parseKeyframes(animator, 'scale', (_d = kfholder.scale) !== null && _d !== void 0 ? _d : [], figuraAnim.snapping);
    });
    // Add it to the project
    anim.add();
}
function parseKeyframes(animator, channel, frames, snapping) {
    (0,_figura__WEBPACK_IMPORTED_MODULE_0__.groupAdjacent)(frames, f => f.time)
        .map(adjacents => {
        let kf = adjacents[0];
        const options = {
            channel,
            data_points: adjacents.map(figvec => ({
                x: figvec.data[0],
                y: figvec.data[1],
                z: figvec.data[2]
            })),
            time: adjacents[0].time / (snapping !== null && snapping !== void 0 ? snapping : 1),
        };
        switch (kf.interpolation) {
            case 'linear':
                options.interpolation = 'linear';
                break;
            case 'catmullrom':
                options.interpolation = 'catmullrom';
                break;
            case 'step':
                options.interpolation = 'step';
                break;
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
        return options;
    })
        .forEach(kf => animator.addKeyframe(kf));
}
// Helpers
// Min inclusive, max exclusive
function checkInteger(item, min, max, msg) {
    return (Number.isInteger(item) && item >= min && item < max) ? item : err(msg);
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
/******/ 	__webpack_require__("./src/figura.ts");
/******/ 	var __webpack_exports__ = __webpack_require__("./figura.js");
/******/ 	
/******/ })()
;