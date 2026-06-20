import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

// Global log toggle: true = print logs, false = mute all logs
const ENABLE_LOG = false;

const ENGLISH_MODES = ['A', 'en', 'EN', 'En', 'Eng', 'ENG', 'eng', '英', '英文', '英数', 'Ｅｎｇ', '영'];

// 关键修复：补上 extends Extension
export default class CustomInputMethodIndicator extends Extension {
    enable() {
        if (ENABLE_LOG) log("=== CustomInputMethodIndicator enabled ===");
        this._signals = [];
        this._oldText = '';
        this._curText = '';
        this._lastCaps = false;
        this._settings = this.getSettings();
        this._updateStyle();
        try {
            const kb = Main.panel.statusArea.keyboard;
            const imManager = kb._inputSourceManager;
            this._keymap = Clutter.get_default_backend().get_default_seat().get_keymap();
            this._connect(this._keymap, 'state-changed', () => {
                this._updateIndicator("caps");
            });
            this._connect(imManager, 'current-source-changed', () => {
                this._updateIndicator("switch");
            });
            this._connect(this._settings, 'changed', () => {
                this._updateStyle();
                this._updateIndicator("settings");
            });
            this._updateIndicator("init");
        } catch (e) {
            logError('CustomInputMethodIndicator enable error：', e);
        }
    }
    _updateStyle() {
        if (ENABLE_LOG) log("CustomInputMethodIndicator: Load config and update style");
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
            if (ENABLE_LOG) log("CustomInputMethodIndicator triggered by：" + triggerSource);
            const kb = Main.panel.statusArea?.keyboard;
            if (!kb) return;
            const curSource = kb._inputSourceManager?.currentSource;
            if (!curSource) return;
            const label = kb._container.get_child_at_index(curSource.index);
            if (!label) return;
            this._curText = label.get_text();
            if (ENABLE_LOG) log("CustomInputMethodIndicator panel text：" + this._curText + ", old text: " + this._oldText);
            if (ENABLE_LOG) log("CustomInputMethodIndicator CapsLock：" + isCaps);
            if (isCaps) {
                if (triggerSource.includes("switch")) {
                    if (this._curText !== this.caps.text) {
                        this._oldText = this._curText;
                        if (ENABLE_LOG) log("CustomInputMethodIndicator update old text：" + this._oldText);
                    }
                } else if (this._oldText === "") {
                    this._oldText = this._curText;
                    if (ENABLE_LOG) log("CustomInputMethodIndicator update old text：" + this._oldText);
                }
                if (ENABLE_LOG) log("CustomInputMethodIndicator: Mode = CapsLock\n");
                if (this.caps.text === "") this.caps.text = "A";
                label.set_text(this.caps.text);
                label.set_style(this._buildStyle(this.caps));
            } else {
                if (this._curText === this.caps.text && this._oldText !== "") {
                    this._curText = this._oldText;
                    if (ENABLE_LOG) log("CustomInputMethodIndicator: restore old text：" + this._oldText);
                }
                if (ENGLISH_MODES.includes(this._curText)) {
                    if (ENABLE_LOG) log("CustomInputMethodIndicator: Mode = English\n");
                    if (this.lower.text === "") this.lower.text = "En";
                    label.set_text(this.lower.text);
                    label.set_style(this._buildStyle(this.lower));
                } else {
                    if (ENABLE_LOG) log("CustomInputMethodIndicator: Mode = Native\n");
                    const showText = this.native.text || this._curText;
                    label.set_text(showText);
                    label.set_style(this._buildStyle(this.native));
                }
                this._oldText = "";
            }
        } catch (e) {
            logError("CustomInputMethodIndicator execution error：", e);
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
    _connect(target, signal, callback) {
        const id = target.connect(signal, callback);
        this._signals.push({ target, id });
    }
    disable() {
        if (ENABLE_LOG) log("=== CustomInputMethodIndicator disabled ===");
        this._signals.forEach(s => s.target.disconnect(s.id));
        this._signals = [];
        this._settings = null;
        this._oldText = null;
        this._curText = null;
        this._keymap = null;
    }
}

