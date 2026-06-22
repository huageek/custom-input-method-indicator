import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import {
    ExtensionPreferences,
    gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const CONTROL_WIDTH = 170;
const ORI_VERT = 1;
const ORI_HORI = 0;

export default class CustomInputMethodIndicatorPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window.set_title('Custom Input Method Indicator');
        window.set_default_size(600, 400);
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup();
        page.add(group);
        window.add(page);
        const mainBox = new Gtk.Box({
            orientation: ORI_VERT,
            hexpand: true,
        });
        group.add(mainBox);
        const notebook = new Gtk.Notebook();
        mainBox.append(notebook);
        const settings = this.getSettings();
        // ==== CapsLock ====
        const capsPage = this._createPage(notebook, 'CapsLock');
        this._addLabeledEntry(capsPage, settings, 'text-caps', 'Display Text', 'A');
        this._addLabeledSpinClear(capsPage, settings, 'size-caps', 'Font Size');
        this._addLabeledEntry(capsPage, settings, 'color-custom-caps', 'Font Color', '#RRGGBB');
        this._addLabeledSwitch(capsPage, settings, 'bold-caps', 'Bold');
        // ==== English ====
        const engPage = this._createPage(notebook, 'English');
        this._addLabeledEntry(engPage, settings, 'text-lower', 'Display Text', 'En');
        this._addLabeledSpinClear(engPage, settings, 'size-lower', 'Font Size');
        this._addLabeledEntry(engPage, settings, 'color-custom-lower', 'Font Color', '#RRGGBB');
        this._addLabeledSwitch(engPage, settings, 'bold-lower', 'Bold');
        // ==== Native ====
        const chnPage = this._createPage(notebook, 'Native');
        this._addLabeledEntry(chnPage, settings, 'text-native', 'Display Text');
        this._addLabeledSpinClear(chnPage, settings, 'size-native', 'Font Size');
        this._addLabeledEntry(chnPage, settings, 'color-custom-native', 'Font Color', '#RRGGBB');
        this._addLabeledSwitch(chnPage, settings, 'bold-native', 'Bold');
        // ==== About ====
        const aboutPage = this._createPage(notebook, 'About');
        this._addAbout(aboutPage);
        // Click blank area to unfocus
        const gesture = new Gtk.GestureClick();
        gesture.connect('pressed', () => {
            window.set_focus(null);
        });
        page.add_controller(gesture);
    }
    _createPage(notebook, title) {
        const box = new Gtk.Box({ orientation: ORI_VERT });
        const frame = new Gtk.Frame({
            margin_top: 16,
            margin_bottom: 24,
            margin_start: 8,
            margin_end: 8,
        });
        const grid = new Gtk.Grid({
            margin_top: 16,
            margin_bottom: 16,
            margin_start: 16,
            margin_end: 16,
            row_spacing: 12,
            column_spacing: 12,
            hexpand: true
        });
        grid._row = 0;
        frame.set_child(grid);
        box.append(frame);
        notebook.append_page(box, new Gtk.Label({ label: title }));
        return grid;
    }
    _addLabeledEntry(grid, settings, key, labelText, placeholder = '') {
        const label = new Gtk.Label({ label: labelText, halign: Gtk.Align.START });
        const entry = new Gtk.Entry({
            width_request: CONTROL_WIDTH,
            halign: Gtk.Align.END,
            hexpand: false,
            placeholder_text: placeholder
        });
        const container = new Gtk.Box();
        container.hexpand = true;
        container.halign = Gtk.Align.END;
        container.append(entry);
        settings.bind(key, entry, 'text', Gio.SettingsBindFlags.DEFAULT);
        grid.attach(label, 0, grid._row, 1, 1);
        grid.attach(container, 1, grid._row++, 1, 1);
    }
    _addLabeledSpinClear(grid, settings, key, labelText) {
        const label = new Gtk.Label({ label: labelText, halign: Gtk.Align.START });
        const entry = new Gtk.Entry({
            width_request: CONTROL_WIDTH,
            halign: Gtk.Align.END,
            hexpand: false,
            placeholder_text: "Default(px)"
        });
        const container = new Gtk.Box();
        container.hexpand = true;
        container.halign = Gtk.Align.END;
        container.append(entry);
        settings.bind(key, entry, 'text', Gio.SettingsBindFlags.DEFAULT);
        grid.attach(label, 0, grid._row, 1, 1);
        grid.attach(container, 1, grid._row++, 1, 1);
    }
    _addLabeledSwitch(grid, settings, key, labelText) {
        const label = new Gtk.Label({ label: labelText, halign: Gtk.Align.START });
        const sw = new Gtk.Switch({
            halign: Gtk.Align.END,
            hexpand: false
        });
        const container = new Gtk.Box();
        container.hexpand = true;
        container.halign = Gtk.Align.END;
        container.append(sw);
        settings.bind(key, sw, 'active', Gio.SettingsBindFlags.DEFAULT);
        grid.attach(label, 0, grid._row, 1, 1);
        grid.attach(container, 1, grid._row++, 1, 1);
    }
    _addAbout(grid) {
        const label = new Gtk.Label({
            use_markup: true,
            label: '<b>Custom Input Method Indicator 1.0</b>',
            halign: Gtk.Align.CENTER,
        });
        grid.attach(label, 0, grid._row++, 2, 1);
    }
}

