import "./style.css"
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

// Util functions (todo maybe move to another file)

// Map values of a string-keyed record from V1 to V2. The key is also passed to the mapper func.
export function mapValues<V1, V2>(obj: Record<string, V1>, func: (key: string, val: V1) => V2): Record<string, V2> {
	const result: Record<string, V2> = {}
	for (const key in obj) {
		result[key] = func(key, obj[key]);
	}
	return result
}
export function forEachEntry<V>(obj: Record<string, V>, func: (key: string, val: V) => void) {
	for (const key in obj) {
		func(key, obj[key]);
	}
}
// Convert a list of items into an association from name -> value
export function associate<T, V>(items: T[], func: (item: T) => [string, V]): Record<string, V> {
	const result: Record<string, V> = {}
	for (const item of items) {
		const [key, val] = func(item)
		result[key] = val
	}
	return result
}
// Group adjacent values by comparing their extracted keys
export function groupAdjacent<T, K>(items: T[], key_extractor: (item: T) => K): T[][] {
	const result: T[][] = [];
	var i = 0;
	while (i < items.length) {
		const key = key_extractor(items[i])
		const nextArr: T[] = [items[i]]
		i++;
		while (i < items.length && key_extractor(items[i]) === key) {
			nextArr.push(items[i]);
			i++;
		}
		result.push(nextArr)
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

