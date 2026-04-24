"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultPreferences = exports.listKnownPreferences = exports.removePreference = exports.updateManyPreferences = exports.updatePreference = exports.getCategories = exports.updatePreferences = exports.getPreferences = void 0;
const preferences_schema_1 = require("./preferences.schema");
const preferences_service_1 = require("./preferences.service");
/**
 * GET /api/preferences
 * Obtiene las preferencias del usuario autenticado
 */
const getPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        // Obtener preferencias clave-valor
        const prefsObj = await (0, preferences_service_1.getUserPreferences)(userId);
        // Obtener categorías favoritas
        const categories = await (0, preferences_service_1.getFavoriteCategories)(userId);
        res.status(200).json({
            preferences: prefsObj,
            favoriteCategories: categories,
        });
    }
    catch (error) {
        console.error("Error getting preferences:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.getPreferences = getPreferences;
/**
 * PUT /api/preferences
 * Actualiza las preferencias del usuario usando la estructura del frontend
 */
const updatePreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notifications_enabled, email_notifications, theme, language, font_size, favoriteCategories } = req.body;
        // Guardar preferencias simples
        const prefs = {};
        if (notifications_enabled !== undefined)
            prefs.notifications_enabled = String(notifications_enabled);
        if (email_notifications !== undefined)
            prefs.email_notifications = String(email_notifications);
        if (theme !== undefined)
            prefs.theme = String(theme);
        if (language !== undefined)
            prefs.language = String(language);
        if (font_size !== undefined)
            prefs.font_size = String(font_size);
        if (Object.keys(prefs).length > 0) {
            await (0, preferences_service_1.setManyPreferencesRaw)(userId, prefs);
        }
        // Guardar categorías favoritas
        if (favoriteCategories && Array.isArray(favoriteCategories)) {
            // Primero obtener todas las categorías para mapear código a ID
            const allCategories = await (0, preferences_service_1.getAllCategories)();
            const categoryMap = new Map(allCategories.map(c => [c.code, c.id]));
            const categoryIdsToSave = [];
            for (const code of favoriteCategories) {
                const categoryId = categoryMap.get(code);
                if (categoryId) {
                    categoryIdsToSave.push(categoryId);
                }
            }
            await (0, preferences_service_1.setFavoriteCategories)(userId, categoryIdsToSave);
        }
        res.json({
            message: "Preferencias actualizadas correctamente",
            saved: true
        });
    }
    catch (error) {
        console.error("Error updating preferences:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.updatePreferences = updatePreferences;
/**
 * GET /api/preferences/categories
 * Obtiene todas las categorías disponibles
 */
const getCategories = async (req, res) => {
    try {
        const categories = await (0, preferences_service_1.getAllCategories)();
        res.json(categories);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getCategories = getCategories;
// Viejos endpoints por retrocompatibilidad
const updatePreference = async (req, res) => {
    try {
        const userId = req.user.id;
        const validated = preferences_schema_1.setPreferenceSchema.parse(req.body);
        const preference = await (0, preferences_service_1.setPreference)(userId, validated);
        res.json(preference);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updatePreference = updatePreference;
const updateManyPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const validated = preferences_schema_1.setManyPreferencesSchema.parse(req.body);
        const preferences = await (0, preferences_service_1.setManyPreferences)(userId, validated);
        res.json(preferences);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateManyPreferences = updateManyPreferences;
const removePreference = async (req, res) => {
    try {
        const userId = req.user.id;
        const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
        await (0, preferences_service_1.deletePreference)(userId, key);
        res.json({ message: "Preference deleted" });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.removePreference = removePreference;
const listKnownPreferences = async (req, res) => {
    try {
        const known = await (0, preferences_service_1.getKnownPreferences)();
        res.json(known);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.listKnownPreferences = listKnownPreferences;
const getDefaultPreferences = async (_req, res) => {
    res.json({
        preferences: {
            theme: 'light',
            language: 'es',
            font_size: 'medium',
            notifications_enabled: 'true',
        }
    });
};
exports.getDefaultPreferences = getDefaultPreferences;
