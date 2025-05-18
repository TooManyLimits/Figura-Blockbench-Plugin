import { create_format } from './format';
import { setup_mimic_parts } from './features/mimic_parts';
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

		setup_mimic_parts();
		setup_vanilla_texture_override();
		create_format();
	},

	// Delete all the deletable objects.
	onunload() {
		for (let v of deletables) v.delete();
		deletables = [];
	},

});

