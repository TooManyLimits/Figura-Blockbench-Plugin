import { deleteLater, PLUGIN_ID } from "../figura";


export function setup_vanilla_texture_override() {

	deleteLater(new Property(Texture, 'string', 'vanilla_texture_override', {condition: {formats: [PLUGIN_ID]}}));

	Texture.prototype.menu.addAction(deleteLater(new Action('figura_vanilla_texture_override', {
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
