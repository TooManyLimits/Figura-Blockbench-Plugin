/*
 * Generated type guards for "figura_data.ts".
 * WARNING: Do not manually change this file.
 */
import { FiguraData, FiguraGroup, FiguraCube, FiguraCubeFace, FiguraMesh, FiguraMeshVertex, FiguraMeshFace, FiguraMeshVertexInfo, FiguraTexture, FiguraItemDisplayData, FiguraItemDisplayTransform, FiguraAnim, FiguraKeyframeHolder, FiguraScriptKeyframe, FiguraVectorKeyframe, FiguraKeyframeInterpolation, FiguraVec2, FiguraVec3 } from "./figura_data";

export function isFiguraData(obj: unknown): obj is FiguraData {
    const typedObj = obj as FiguraData
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["roots"] === "undefined" ||
            (typedObj["roots"] !== null &&
                typeof typedObj["roots"] === "object" ||
                typeof typedObj["roots"] === "function") &&
            Object.entries<any>(typedObj["roots"])
                .every(([key, value]) => (isFiguraGroup(value) as boolean &&
                    typeof key === "string"))) &&
        (typeof typedObj["textures"] === "undefined" ||
            (typedObj["textures"] !== null &&
                typeof typedObj["textures"] === "object" ||
                typeof typedObj["textures"] === "function") &&
            Object.entries<any>(typedObj["textures"])
                .every(([key, value]) => (isFiguraTexture(value) as boolean &&
                    typeof key === "string"))) &&
        (typeof typedObj["animations"] === "undefined" ||
            (typedObj["animations"] !== null &&
                typeof typedObj["animations"] === "object" ||
                typeof typedObj["animations"] === "function") &&
            Object.entries<any>(typedObj["animations"])
                .every(([key, value]) => (isFiguraAnim(value) as boolean &&
                    typeof key === "string"))) &&
        (typeof typedObj["item_display_data"] === "undefined" ||
            isFiguraItemDisplayData(typedObj["item_display_data"]) as boolean)
    )
}

export function isFiguraGroup(obj: unknown): obj is FiguraGroup {
    const typedObj = obj as FiguraGroup
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["origin"] === "undefined" ||
            isFiguraVec3(typedObj["origin"]) as boolean) &&
        (typeof typedObj["rotation"] === "undefined" ||
            isFiguraVec3(typedObj["rotation"]) as boolean) &&
        (typeof typedObj["children"] === "undefined" ||
            (typedObj["children"] !== null &&
                typeof typedObj["children"] === "object" ||
                typeof typedObj["children"] === "function") &&
            Object.entries<any>(typedObj["children"])
                .every(([key, value]) => (isFiguraGroup(value) as boolean &&
                    typeof key === "string"))) &&
        (typeof typedObj["mimic_part"] === "undefined" ||
            typeof typedObj["mimic_part"] === "string") &&
        (typeof typedObj["texture_index"] === "undefined" ||
            typeof typedObj["texture_index"] === "number") &&
        (typeof typedObj["cubes"] === "undefined" ||
            Array.isArray(typedObj["cubes"]) &&
            typedObj["cubes"].every((e: any) =>
                isFiguraCube(e) as boolean
            )) &&
        (typeof typedObj["meshes"] === "undefined" ||
            Array.isArray(typedObj["meshes"]) &&
            typedObj["meshes"].every((e: any) =>
                isFiguraMesh(e) as boolean
            ))
    )
}

export function isFiguraCube(obj: unknown): obj is FiguraCube {
    const typedObj = obj as FiguraCube
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["origin"] === "undefined" ||
            isFiguraVec3(typedObj["origin"]) as boolean) &&
        (typeof typedObj["rotation"] === "undefined" ||
            isFiguraVec3(typedObj["rotation"]) as boolean) &&
        isFiguraVec3(typedObj["from"]) as boolean &&
        isFiguraVec3(typedObj["to"]) as boolean &&
        (typeof typedObj["inflate"] === "undefined" ||
            isFiguraVec3(typedObj["inflate"]) as boolean) &&
        Array.isArray(typedObj["faces"]) &&
        (typedObj["faces"][0] === null ||
            isFiguraCubeFace(typedObj["faces"][0]) as boolean) &&
        (typedObj["faces"][1] === null ||
            isFiguraCubeFace(typedObj["faces"][1]) as boolean) &&
        (typedObj["faces"][2] === null ||
            isFiguraCubeFace(typedObj["faces"][2]) as boolean) &&
        (typedObj["faces"][3] === null ||
            isFiguraCubeFace(typedObj["faces"][3]) as boolean) &&
        (typedObj["faces"][4] === null ||
            isFiguraCubeFace(typedObj["faces"][4]) as boolean) &&
        (typedObj["faces"][5] === null ||
            isFiguraCubeFace(typedObj["faces"][5]) as boolean)
    )
}

export function isFiguraCubeFace(obj: unknown): obj is FiguraCubeFace {
    const typedObj = obj as FiguraCubeFace
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isFiguraVec2(typedObj["uv_min"]) as boolean &&
        isFiguraVec2(typedObj["uv_max"]) as boolean &&
        (typeof typedObj["rotation"] === "undefined" ||
            typedObj["rotation"] === 0 ||
            typedObj["rotation"] === 90 ||
            typedObj["rotation"] === 180 ||
            typedObj["rotation"] === 270)
    )
}

export function isFiguraMesh(obj: unknown): obj is FiguraMesh {
    const typedObj = obj as FiguraMesh
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["origin"] === "undefined" ||
            isFiguraVec3(typedObj["origin"]) as boolean) &&
        (typeof typedObj["rotation"] === "undefined" ||
            isFiguraVec3(typedObj["rotation"]) as boolean) &&
        Array.isArray(typedObj["vertices"]) &&
        typedObj["vertices"].every((e: any) =>
            isFiguraMeshVertex(e) as boolean
        ) &&
        Array.isArray(typedObj["faces"]) &&
        typedObj["faces"].every((e: any) =>
            isFiguraMeshFace(e) as boolean
        )
    )
}

export function isFiguraMeshVertex(obj: unknown): obj is FiguraMeshVertex {
    const typedObj = obj as FiguraMeshVertex
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isFiguraVec3(typedObj["pos"]) as boolean
    )
}

export function isFiguraMeshFace(obj: unknown): obj is FiguraMeshFace {
    const typedObj = obj as FiguraMeshFace
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (Array.isArray(typedObj["vertices"]) &&
            isFiguraMeshVertexInfo(typedObj["vertices"][0]) as boolean &&
            isFiguraMeshVertexInfo(typedObj["vertices"][1]) as boolean &&
            isFiguraMeshVertexInfo(typedObj["vertices"][2]) as boolean ||
            Array.isArray(typedObj["vertices"]) &&
            isFiguraMeshVertexInfo(typedObj["vertices"][0]) as boolean &&
            isFiguraMeshVertexInfo(typedObj["vertices"][1]) as boolean &&
            isFiguraMeshVertexInfo(typedObj["vertices"][2]) as boolean &&
            isFiguraMeshVertexInfo(typedObj["vertices"][3]) as boolean)
    )
}

export function isFiguraMeshVertexInfo(obj: unknown): obj is FiguraMeshVertexInfo {
    const typedObj = obj as FiguraMeshVertexInfo
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["index"] === "number" &&
        isFiguraVec2(typedObj["uv"]) as boolean
    )
}

export function isFiguraTexture(obj: unknown): obj is FiguraTexture {
    const typedObj = obj as FiguraTexture
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["path"] === "undefined" ||
            typeof typedObj["path"] === "string") &&
        isFiguraVec2(typedObj["uv_size"]) as boolean &&
        (typeof typedObj["vanilla_texture_override"] === "undefined" ||
            typeof typedObj["vanilla_texture_override"] === "string") &&
        typeof typedObj["png_bytes_base64"] === "string"
    )
}

export function isFiguraItemDisplayData(obj: unknown): obj is FiguraItemDisplayData {
    const typedObj = obj as FiguraItemDisplayData
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        Object.entries<any>(typedObj)
            .every(([key, value]) => (isFiguraItemDisplayTransform(value) as boolean &&
                typeof key === "string"))
    )
}

export function isFiguraItemDisplayTransform(obj: unknown): obj is FiguraItemDisplayTransform {
    const typedObj = obj as FiguraItemDisplayTransform
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["translation"] === "undefined" ||
            isFiguraVec3(typedObj["translation"]) as boolean) &&
        (typeof typedObj["rotation"] === "undefined" ||
            isFiguraVec3(typedObj["rotation"]) as boolean) &&
        (typeof typedObj["scale"] === "undefined" ||
            isFiguraVec3(typedObj["scale"]) as boolean)
    )
}

export function isFiguraAnim(obj: unknown): obj is FiguraAnim {
    const typedObj = obj as FiguraAnim
    return (
        (typedObj !== null &&
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
            Object.entries<any>(typedObj["parts"])
                .every(([key, value]) => (isFiguraKeyframeHolder(value) as boolean &&
                    typeof key === "string"))) &&
        (typeof typedObj["script_keyframes"] === "undefined" ||
            Array.isArray(typedObj["script_keyframes"]) &&
            typedObj["script_keyframes"].every((e: any) =>
                isFiguraScriptKeyframe(e) as boolean
            ))
    )
}

export function isFiguraKeyframeHolder(obj: unknown): obj is FiguraKeyframeHolder {
    const typedObj = obj as FiguraKeyframeHolder
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["origin"] === "undefined" ||
            Array.isArray(typedObj["origin"]) &&
            typedObj["origin"].every((e: any) =>
                isFiguraVectorKeyframe(e) as boolean
            )) &&
        (typeof typedObj["rotation"] === "undefined" ||
            Array.isArray(typedObj["rotation"]) &&
            typedObj["rotation"].every((e: any) =>
                isFiguraVectorKeyframe(e) as boolean
            )) &&
        (typeof typedObj["scale"] === "undefined" ||
            Array.isArray(typedObj["scale"]) &&
            typedObj["scale"].every((e: any) =>
                isFiguraVectorKeyframe(e) as boolean
            ))
    )
}

export function isFiguraScriptKeyframe(obj: unknown): obj is FiguraScriptKeyframe {
    const typedObj = obj as FiguraScriptKeyframe
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["time"] === "number" &&
        typeof typedObj["data"] === "string"
    )
}

export function isFiguraVectorKeyframe(obj: unknown): obj is FiguraVectorKeyframe {
    const typedObj = obj as FiguraVectorKeyframe
    return (
        (typedObj !== null &&
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
        isFiguraKeyframeInterpolation(typedObj["interpolation"]) as boolean
    )
}

export function isFiguraKeyframeInterpolation(obj: unknown): obj is FiguraKeyframeInterpolation {
    const typedObj = obj as FiguraKeyframeInterpolation
    return (
        (typedObj === "linear" ||
            typedObj === "catmullrom" ||
            typedObj === "step" ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            typedObj["kind"] === "bezier" &&
            isFiguraVec3(typedObj["left_time"]) as boolean &&
            isFiguraVec3(typedObj["left_value"]) as boolean &&
            isFiguraVec3(typedObj["right_time"]) as boolean &&
            isFiguraVec3(typedObj["right_value"]) as boolean)
    )
}

export function isFiguraVec2(obj: unknown): obj is FiguraVec2 {
    const typedObj = obj as FiguraVec2
    return (
        Array.isArray(typedObj) &&
        typeof typedObj[0] === "number" &&
        typeof typedObj[1] === "number"
    )
}

export function isFiguraVec3(obj: unknown): obj is FiguraVec3 {
    const typedObj = obj as FiguraVec3
    return (
        Array.isArray(typedObj) &&
        typeof typedObj[0] === "number" &&
        typeof typedObj[1] === "number" &&
        typeof typedObj[2] === "number"
    )
}
