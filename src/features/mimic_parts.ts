import { deleteLater, PLUGIN_ID } from "../figura";

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
}

// Helpers because multi_selected and first_selected and properties are annoying
function oneGroup<T>(func: (group: Group) => T): T | undefined {
	if (Group.multi_selected.length === 1) {
		return func(Group.first_selected!);
	} else {
		return undefined;
	}
}


type ENTITIES = [string, MODELS][]; // Map entity type -> list of models
type MODELS = [string, MODELPART[]][]; // Map model name -> children of the root
type MODELPART = string | [string, MODELPART[]]; // Tree of model parts with names and possibly children

function expand_entities(entities: ENTITIES): any[] {
	return entities.map(entity => deleteLater(new Action('figura.mimic_part_selector.' + entity[0], {
		name: entity[0],
		children: expand_models('figura.mimic_part_selector.' + entity[0], entity[1]),
		click() {}
	})));
}
function expand_models(action_prefix: string, models: MODELS): any[] {
	return models.map(model => deleteLater(new Action(action_prefix + '.' + model[0], {
		name: model[0],
		children: expand_model_parts(action_prefix + '.' + model[0], model[1], model[0]),
		click() {}
	})));
}
function expand_model_parts(action_prefix: string, parts: MODELPART[], model_name: string): any[] {
	return parts.map(part => {
		if (typeof part === 'string') {
			return deleteLater(new Action(action_prefix + '.' + part, {
				name: part,
				click() { oneGroup(group => group.mimic_part = model_name + '/' + part); }
			}));
		} else {
			const action = deleteLater(new Action(action_prefix + '.' + part[0], {
				name: part[0],
				children: expand_model_parts(action_prefix + '.' + part[0], part[1], model_name),
				click() { oneGroup(group => group.mimic_part = model_name + '/' + part[0]); }
			}));
			// Manually add event listener, since it normally doesn't work on actions with children
			action.menu_node.addEventListener('click', event => {
				if (event.target !== action.menu_node) return;
				action.trigger(event);
				open_menu?.hide(); // Hide the menu, since that also doesn't happen automatically when clicking action with children
			});
			return action;
		}
	});
}

const SUPPORTED_MIMICS: ENTITIES = [
	['Player', [
		['ENTITY', [
			['head', ['hat']],
			['body', ['jacket']],
			['left_arm', ['left_sleeve']],
			['right_arm', ['right_sleeve']],
			['left_leg', ['left_pants']],
			['right_leg', ['right_pants']],
		]],
		['ELYTRA', [
			'left_wing',
			'right_wing'
		]],
		['CAPE_ROOT', [
			['body', ['cape']]
		]]
	]],
	['Fox', [
		['ENTITY', [
			['head', [
				'left_ear', 'right_ear',
				'nose'
			]],
			['body', ['tail']],
			'left_front_leg',
			'right_front_leg',
			'left_hind_leg',
			'right_hind_leg',
		]]
	]]
];