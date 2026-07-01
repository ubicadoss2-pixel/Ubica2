"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMapPoints = exports.getEventCategories = exports.getPlaceTypes = exports.getCities = void 0;
const catalog_service_1 = require("./catalog.service");
const getCities = async (_req, res) => {
    const cities = await (0, catalog_service_1.listCities)();
    res.json(cities);
};
exports.getCities = getCities;
const getPlaceTypes = async (_req, res) => {
    const types = await (0, catalog_service_1.listPlaceTypes)();
    res.json(types);
};
exports.getPlaceTypes = getPlaceTypes;
const getEventCategories = async (_req, res) => {
    const categories = await (0, catalog_service_1.listEventCategories)();
    res.json(categories);
};
exports.getEventCategories = getEventCategories;
const getMapPoints = async (_req, res) => {
    const data = await (0, catalog_service_1.getMapData)();
    res.json(data);
};
exports.getMapPoints = getMapPoints;
