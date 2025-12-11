import { deleteLater, PLUGIN_ID } from "../figura";
import mimic_part_outliner_override from "./mimic_parts_outliner";

// Set up mimic part functionality.
export function setup_mimic_parts() {

	// New property on groups to store the current mimic part
	deleteLater(new Property(Group, 'string', 'mimic_part', {condition: {formats: [PLUGIN_ID]}}));

	// Display action for current mimic, and click to change.
	let displayCurrent = deleteLater(new Action('figura_current_mimic_part', {
		name: 'No mimic part selected',
		click() {
			oneGroup(group => {
				Blockbench.textPrompt('Type a part to mimic manually. Example: ENTITY/head', group.mimic_part || '', given => {
					group.mimic_part = given || undefined
				});
			});
		}
	}))

	// Actions for setting these values.
	let chooseMimicPart = deleteLater(new Action('figura_choose_mimic_part', {
		name: 'Figura: Mimic Part',
		description: 'Choose which vanilla part this part will mimic.',
		icon: 'accessibility_new',
		category: 'edit',
		condition: {
			formats: [PLUGIN_ID],
			method() {
				return !!oneGroup(group => {
					// Cursed condition with side effects... needed to change the name.
					displayCurrent.setName(group.mimic_part ?
						'Current: \"' + group.mimic_part + '\"' :
						'No mimic part selected'
					);
					return true;
				});
			}
		},
		children: [displayCurrent, ...expand_entities(SUPPORTED_MIMICS)],
		click() {}
	}));

	// Add actions to group menu.
	Group.prototype.menu?.structure.push(new MenuSeparator()); // Separator before figura stuff
	Group.prototype.menu?.addAction(chooseMimicPart);

	// Override the outliner
	mimic_part_outliner_override();
}

// Helpers because multi_selected and first_selected and properties are annoying
function oneGroup<T>(func: (group: Group) => T): T | undefined {
	if (Group.multi_selected.length === 1) {
		return func(Group.first_selected!);
	} else {
		return undefined;
	}
}


type ENTITIES = [string, MODELPART[]][]; // Map entity type -> list of parts
type MODELPART = string | [string, MODELPART[]]; // Tree of model parts with names and possibly children

function expand_entities(entities: ENTITIES): any[] {
	return entities.map(entity => deleteLater(new Action('figura.mimic_part_selector.' + entity[0], {
		name: entity[0],
		children: expand_model_parts('figura.mimic_part_selector.' + entity[0], entity[1]),
		click() {}
	})));
}
// Underscore means it's not clickable and is just a subfolder for organization
function expand_model_parts(action_prefix: string, parts: MODELPART[]): any[] {
	return parts.map(part => {
		if (typeof part === 'string') {
			return deleteLater(new Action(action_prefix + '.' + part, {
				name: part,
				click() { oneGroup(group => group.mimic_part = part); }
			}));
		} else {
			const action = deleteLater(new Action(action_prefix + '.' + part[0], {
				name: part[0].startsWith('_') ? part[0].substring(1) : part[0], // Strip underscore
				children: expand_model_parts(action_prefix + '.' + part[0], part[1]),
				click: part[0].startsWith('_') ? () => {} : () => { oneGroup(group => group.mimic_part = part[0]); }
			}));
			// Manually add event listener, since it normally doesn't work on actions with children
			if (!part[0].startsWith('_')) {
					action.menu_node.addEventListener('click', event => {
					if (event.target !== action.menu_node) return;
					action.trigger(event);
					open_interface?.hide();
					open_menu?.hide(); // Hide the menu, since that also doesn't happen automatically when clicking action with children
				});
			}
			return action;
		}
	});
}


const PLAYER: MODELPART[] = [
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

const SUPPORTED_MIMICS: ENTITIES = [
	['Player', PLAYER],
];

