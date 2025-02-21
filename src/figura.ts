import { create_format } from './format';
import { setup_vanilla_roots } from './features/vanilla_roots';
import { setup_vanilla_texture_override } from './features/vanilla_texture_override';

// Global constants
export const PLUGIN_ID = 'figura';
export const FILE_EXTENSION = 'figmodel';

// Track deletable objects.
// When creating an object you want to be deleted, wrap with deleteLater().
let deletables: Deletable[] = [];
export function deleteLater<T extends Deletable>(x: T): T {
	deletables.push(x);
	return x;
}
export function defer(func: () => void) {
	deletables.push({delete: func});
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
			Blockbench.addListener<EventName>('finish_edit', callback);
			defer(() => Blockbench.removeListener('finish_edit', callback));
		}

		setup_vanilla_roots();
		setup_vanilla_texture_override();
		create_format();
	},

	// Delete all the deletable objects.
	onunload() {
		for (let v of deletables) v.delete();
		deletables = [];
	},

});

