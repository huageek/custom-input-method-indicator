import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

const ENABLE_DEBUG = false;
const ENGLISH_MODES = ['A', 'en', 'EN', 'En', 'Eng', 'ENG', 'eng', '英', '英文', '英数', 'Ｅｎｇ', '영'];

function debugMsg(...args) {
    if (ENABLE_DEBUG) console.debug('[CustomInputMethodIndicator]', ...args);
}
function errorMsg(...args) {
    console.error('[CustomInputMethodIndicator]', ...args);
}

export default class CustomInputMethodIndicator extends Extension {
    constructor(metadata) {
        super(metadata);
        this._oldText = '';
        this._curText = '';
        this._lastCaps = false;
        this._settings = null;
        this._keymap = null;
        this._imManager = null;
    }

    enable() {
        debugMsg("Extension enabled");
        this._settings = this.getSettings();
        this._updateStyle();

        const kb = Main.panel.statusArea.keyboard;
        this._imManager = kb._inputSourceManager;
        this._keymap = Clutter.get_default_backend().get_default_seat().get_keymap();

        this._keymap.connectObject('state-changed', () => this._updateIndicator("caps"), this);
        this._imManager.connectObject('current-source-changed', () => this._updateIndicator("switch"), this);
        this._settings.connectObject('changed', () => {
            this._updateStyle();
            this._updateIndicator("settings");
        }, this);

        this._updateIndicator("init");
    }

    _updateStyle() {
        debugMsg("Load config");
        this.caps = {
            text: this._settings.get_string('text-caps'),
            size: parseInt(this._settings.get_string('size-caps') || 0),
            custom: this._settings.get_string('color-custom-caps'),
            bold: this._settings.get_boolean('bold-caps'),
        };
        this.lower = {
            text: this._settings.get_string('text-lower'),
            size: parseInt(this._settings.get_string('size-lower') || 0),
            custom: this._settings.get_string('color-custom-lower'),
            bold: this._settings.get_boolean('bold-lower'),
        };
        this.native = {
            text: this._settings.get_string('text-native'),
            size: parseInt(this._settings.get_string('size-native') || 0),
            custom: this._settings.get_string('color-custom-native'),
            bold: this._settings.get_boolean('bold-native'),
        };
    }

    _updateIndicator(triggerSource) {
        try {
            const isCaps = this._keymap.get_caps_lock_state();
            if (triggerSource === "caps" && this._lastCaps === isCaps) return;
            this._lastCaps = isCaps;
            debugMsg("Trigger source:", triggerSource);

            const kb = Main.panel.statusArea?.keyboard;
            if (!kb) return;
            const curSource = this._imManager?.currentSource;
            if (!curSource) return;
            const label = kb._container.get_child_at_index(curSource.index);
            if (!label) return;

            this._curText = label.get_text();
            debugMsg("Panel text:", this._curText, "oldText:", this._oldText, "Caps:", isCaps);

            if (isCaps) {
                if (triggerSource.includes("switch")) {
                    if (this._curText !== this.caps.text) {
                        this._oldText = this._curText;
                        debugMsg("Save original text:", this._oldText);
                    }
                } else if (this._oldText === "") {
                    this._oldText = this._curText;
                    debugMsg("Save original text:", this._oldText);
                }
                debugMsg("Mode: CapsLock");
                if (this.caps.text === "") this.caps.text = "A";
                label.set_text(this.caps.text);
                label.set_style(this._buildStyle(this.caps));
            } else {
                if (this._curText === this.caps.text && this._oldText !== "") {
                    this._curText = this._oldText;
                    debugMsg("Restore original text:", this._oldText);
                }
                if (ENGLISH_MODES.includes(this._curText)) {
                    debugMsg("Mode: English");
                    if (this.lower.text === "") this.lower.text = "En";
                    label.set_text(this.lower.text);
                    label.set_style(this._buildStyle(this.lower));
                } else {
                    debugMsg("Mode: Native");
                    const showText = this.native.text || this._curText;
                    label.set_text(showText);
                    label.set_style(this._buildStyle(this.native));
                }
                this._oldText = "";
            }
        } catch (e) {
            errorMsg("Update indicator error", e);
        }
    }

    _buildStyle(conf) {
        let style = '';
        if (conf.size > 0) {
            style += `font-size:${conf.size}px;`;
        }
        style += conf.bold ? 'font-weight:bold;' : 'font-weight:normal;';
        if (conf.custom?.startsWith('#')) {
            style += `color:${conf.custom};`;
        }
        return style;
    }

    disable() {
        debugMsg("Extension disabled");
        this._keymap?.disconnectObject(this);
        this._imManager?.disconnectObject(this);
        this._settings?.disconnectObject(this);
        this._settings = null;
        this._keymap = null;
        this._imManager = null;
        this._oldText = null;
        this._curText = null;
        this._lastCaps = false;
    }
}

