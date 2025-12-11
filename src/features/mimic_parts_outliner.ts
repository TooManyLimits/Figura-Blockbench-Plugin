export default function mimic_part_outliner_override() {
        // @ts-ignore
		// We redifine the outliner component taken from the source code.
    	var VueTreeItem = Vue.extend({
		template: 
		`<li class="outliner_node" v-bind:class="{ parent_li: node.children && node.children.length > 0}" v-bind:id="node.uuid" v-bind:style="{'--indentation': indentation}">` +
			`<div
				class="outliner_object"
				v-bind:class="{ group: node.type === 'group', selected: node.selected }"
				:element_type="node.type"
				@contextmenu.prevent.stop="node.showContextMenu($event)"
				@click="node.clickSelect($event, true)"
				:title="node.title"
				@dblclick.stop.self="!node.locked && renameOutliner(node)"
			>` +
				//Opener icon
				
				`<i
					v-if="node.children && node.children.length > 0 && (!options.hidden_types.length || node.children.some(node => !options.hidden_types.includes(node.type)))"
					@click.stop="node.isOpen = !node.isOpen" class="icon-open-state fa"
					:class='{"fa-angle-right": !node.isOpen, "fa-angle-down": node.isOpen}'
				></i>
				<i v-else class="outliner_opener_placeholder"></i>

				<dynamic-icon :icon="node.icon.replace('fa ', '').replace(/ /g, '.')" :color="(outliner_colors.value && node.color >= 0) ? markerColors[node.color % markerColors.length].pastel : ''" v-on:dblclick.stop="doubleClickIcon(node)"></dynamic-icon>
				<input type="text" class="cube_name tab_target" :class="{locked: node.locked}" v-model="node.name" disabled>` +
            // Here is our injection to display the mimic part.
            `<div
				v-if="node.mimic_part"
				class="outliner-mimic-part"
				>
				{{node.mimic_part}}
			</div>` +

				`<dynamic-icon v-for="(btn, key) in node.buttons" :key="key"
					v-if="Condition(btn, node) && (!btn.advanced_option || options.show_advanced_toggles || (btn.visibilityException && btn.visibilityException(node)) )"
					class="outliner_toggle"
					:icon="getButtonIcon(btn, node)"
					:class="getButtonClasses(btn, node)"
					:title="getBtnTooltip(btn, node)"
					:toggle="btn.id"
					@click.stop
				/>` +
			'</div>' +
			//Other Entries
			'<ul v-if="node.children && node.isOpen">' +
				'<vue-tree-item v-for="item in visible_children" :node="item" :depth="depth + 1" :options="options" :key="item.uuid"></vue-tree-item>' +
				`<div class="outliner_line_guide" v-if="node.children && (node.type == 'group' ? node.constructor.selected.includes(node) : (node.selected && !node.parent.selected))"></div>` +
			'</ul>' +
		'</li>',
		props: {
			options: Object,
			node: {
				type: OutlinerNode
			},
			depth: Number
		},
		data() {return {
			outliner_colors: settings.outliner_colors,
			markerColors
		}},
		computed: {
			indentation() {
                // @ts-ignore
				return limitNumber(this.depth, 0, (this.width-100) / 16);
			},
			visible_children() {
                // @ts-ignore
				let filtered = this.node.children;
                // @ts-ignore
				if (this.options.search_term) {
                    // @ts-ignore
					let search_term_lowercase = this.options.search_term.toLowerCase();
                    // @ts-ignore
					filtered = this.node.children.filter(child => child.matchesFilter(search_term_lowercase));
				}
                // @ts-ignore
				if (!this.options.hidden_types.length) {
					return filtered;
				} else {
                    // @ts-ignore
					return filtered.filter(node => !this.options.hidden_types.includes(node.type));
				}
			}
		},
		methods: {
			nodeClass: function (node: Group) {
				if (node.isOpen) {
					return node.openedIcon || node.icon;
				} else {
					return node.closedIcon || node.icon;
				}
			},
            // @ts-ignore
			getButtonIcon: function (btn: any, node: any) {
				let value = node.isIconEnabled(btn);
				let icon_string = '';
				if (value === true) {
					icon_string = typeof btn.icon == 'function' ? btn.icon(node) : btn.icon;
				} else if (value === false) {
					icon_string = typeof btn.icon_off == 'function' ? btn.icon_off(node) : btn.icon_off
				} else {
					icon_string = typeof btn.icon_alt == 'function' ? btn.icon_alt(node) : btn.icon_alt
				}
				return icon_string.trim().replace(/fa[rs]* /, '');
			},
			getButtonClasses: function (btn: any, node: any) {
				let value = node.isIconEnabled(btn);
				if (value === true) {
					return ''
				} else if (value === false) {
					return 'icon_off';
				} else {
					return 'icon_alt';
				}
			},
			getBtnTooltip: function (btn: any, node: any) {
				let value = node.isIconEnabled(btn);
				let text = btn.title + ': ';
				if (value === true) {
					return text + tl('generic.on');
				} else if (value === false) {
					return text + tl('generic.off');
				} else if (value == 'alt') {
					return text + tl(`switches.${btn.id}.alt`);
				} else {
					return text + value;
				}
			},
			doubleClickIcon(node: any) {
				if (node.children && node.children.length) {
					node.isOpen = !node.isOpen;
				}
			},
            // @ts-ignore
			renameOutliner(node: OutlinerNode) {
                node.rename();
            },
			Condition
		}
	});
	// Here we completely overrite the original vue component.
    // @ts-ignore
    Vue.component('vue-tree-item', VueTreeItem);
}