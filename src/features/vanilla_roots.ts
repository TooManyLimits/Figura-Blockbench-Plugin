import { deleteLater, PLUGIN_ID } from "../figura";

// Set up vanilla root functionality.
export function setup_vanilla_roots() {

	// 2 properties on groups, for what the vanilla root is, and whether to replace.
	deleteLater(new Property(Group, 'string', 'vanilla_root', {condition: {formats: [PLUGIN_ID]}}));
	deleteLater(new Property(Group, 'boolean', 'replace_vanilla_root', {condition: {formats: [PLUGIN_ID]}}));

	// Display action for current root, and click to change.
	let displayCurrent = deleteLater(new Action('figura_current_vanilla_root', {
		name: 'No vanilla root selected',
		click() {
			oneGroup(group => {
				Blockbench.textPrompt('Type a vanilla root manually:', group.vanilla_root || '', given => {
					group.vanilla_root = given || undefined
				});
			});
		}
	}))

	// Actions for setting these values.
	let chooseRoot = deleteLater(new Action('figura_choose_vanilla_root', {
		name: 'Figura: Vanilla Root',
		description: 'Choose which vanilla root this part will follow. Works in vanilla/ folder only.',
		icon: 'accessibility_new',
		category: 'edit',
		condition: {
			formats: [PLUGIN_ID],
			method() {
				return !!oneGroup(group => {
					let success = group.parent === 'root';
					// Cursed condition with side effects... needed to change the name.
					if (success) displayCurrent.setName(group.vanilla_root ?
						'Current: \"' + group.vanilla_root + '\"' :
						'No vanilla root selected'
					);
					return success;
				});
			}
		},
		children: [displayCurrent, ...expand_parts_tree(SUPPORTED_PARTS)],
		click() {}
	}));
	let replaceRoot = deleteLater(new Action('figura_replace_vanilla_root', {
		name: 'Figura: Replace Vanilla Root',
		description: 'Enable this to replace the vanilla part instead of rendering with it.',
		icon: 'check_box_outline_blank',
		condition: {
			formats: [PLUGIN_ID],
			method() {
				return !!oneGroup(group => {
					let success = group.parent === 'root' && group.vanilla_root;
					// Cursed condition with side effects... needed to change the icon.
					if (success) replaceRoot.setIcon(group.replace_vanilla_root ? 'check_box' : 'check_box_outline_blank');
					return success;
				});
			}
		},
		click() {
			oneGroup(group => group.replace_vanilla_root = !group.replace_vanilla_root);
		}
	}));

	// Add actions to group menu.
	Group.prototype.menu?.structure.push(new MenuSeparator()); // Separator before figura stuff
	Group.prototype.menu?.addAction(chooseRoot);
	Group.prototype.menu?.addAction(replaceRoot);
}

// Helpers because multi_selected and first_selected and properties are annoying
function oneGroup<T>(func: (group: Group) => T): T | undefined {
	if (Group.multi_selected.length === 1) {
		return func(Group.first_selected!);
	} else {
		return undefined;
	}
}

// String indicates a termination.
// Null indicates a separator element.
// Object indicates sub-elements.
type PARTS_TREE = (string | null | {name: string, children: PARTS_TREE})[]

function expand_parts_tree(parts: PARTS_TREE, path=''): any[] {
	return parts.map(part => {
		if (part === null) {
			return new MenuSeparator();
		} else if (typeof part === 'string') {
			return deleteLater(new Action('figura_vanilla_root_selector_' + part, {
				name: part,
				click() {
					oneGroup(group => group.vanilla_root = part);
				}
			}));
		} else {
			let newPath = path + '_' + part.name.toLowerCase().replace(' ', '_');
			return deleteLater(new Action('figura_vanilla_root_selector_' + newPath, {
				name: part.name,
				children: expand_parts_tree(part.children, newPath),
				click() {}
			}));
		}
	});
}

const SUPPORTED_PARTS: PARTS_TREE = [
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
]
