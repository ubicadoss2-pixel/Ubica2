"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogs = exports.updateConflict = exports.listConflicts = exports.moderateComment = exports.listComments = exports.activityReport = exports.deleteUser = exports.suspendUser = exports.updateUser = exports.createUser = exports.listUsers = exports.deleteRole = exports.updateRole = exports.createRole = exports.listRoles = exports.approveEvent = exports.validateEvent = exports.approveBusiness = exports.validateBusiness = exports.updateEventStatus = exports.updatePlaceStatus = void 0;
const admin_service_1 = require("./admin.service");
const admin_schema_1 = require("./admin.schema");
const updatePlaceStatus = async (req, res) => {
    try {
        const { status } = admin_schema_1.placeStatusSchema.parse(req.body);
        const result = await (0, admin_service_1.updatePlaceStatusAdmin)(req.params.id, status, req.user.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updatePlaceStatus = updatePlaceStatus;
const updateEventStatus = async (req, res) => {
    try {
        const { status } = admin_schema_1.eventStatusSchema.parse(req.body);
        const result = await (0, admin_service_1.updateEventStatusAdmin)(req.params.id, status, req.user.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateEventStatus = updateEventStatus;
const validateBusiness = async (req, res) => {
    try {
        const result = await (0, admin_service_1.validateBusinessAdmin)(req.params.id, req.user.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.validateBusiness = validateBusiness;
const approveBusiness = async (req, res) => {
    try {
        const result = await (0, admin_service_1.approveBusinessAdmin)(req.params.id, req.user.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.approveBusiness = approveBusiness;
const validateEvent = async (req, res) => {
    try {
        const result = await (0, admin_service_1.validateEventAdmin)(req.params.id, req.user.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.validateEvent = validateEvent;
const approveEvent = async (req, res) => {
    try {
        const result = await (0, admin_service_1.approveEventAdmin)(req.params.id, req.user.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.approveEvent = approveEvent;
const listRoles = async (_req, res) => {
    try {
        const result = await (0, admin_service_1.listRolesAdmin)();
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.listRoles = listRoles;
const createRole = async (req, res) => {
    try {
        const payload = admin_schema_1.roleCreateSchema.parse(req.body);
        const result = await (0, admin_service_1.createRoleAdmin)(payload, req.user.id);
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createRole = createRole;
const updateRole = async (req, res) => {
    try {
        const payload = admin_schema_1.roleUpdateSchema.parse(req.body);
        const result = await (0, admin_service_1.updateRoleAdmin)(req.params.id, payload, req.user.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateRole = updateRole;
const deleteRole = async (req, res) => {
    try {
        const result = await (0, admin_service_1.deleteRoleAdmin)(req.params.id, req.user.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.deleteRole = deleteRole;
const listUsers = async (req, res) => {
    try {
        const query = {
            search: req.query.search,
            roleCode: req.query.roleCode,
            includeDeleted: req.query.includeDeleted === "true",
        };
        const result = await (0, admin_service_1.listUsersAdmin)(query);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.listUsers = listUsers;
const createUser = async (req, res) => {
    try {
        const payload = admin_schema_1.userCreateSchema.parse(req.body);
        const result = await (0, admin_service_1.createUserAdmin)(payload, req.user.id);
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const payload = admin_schema_1.userUpdateSchema.parse(req.body);
        const result = await (0, admin_service_1.updateUserAdmin)(req.params.id, payload, req.user.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateUser = updateUser;
const suspendUser = async (req, res) => {
    try {
        const result = await (0, admin_service_1.suspendUserAdmin)(req.params.id, req.user.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.suspendUser = suspendUser;
const deleteUser = async (req, res) => {
    try {
        const result = await (0, admin_service_1.deleteUserAdmin)(req.params.id, req.user.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.deleteUser = deleteUser;
const activityReport = async (_req, res) => {
    try {
        const result = await (0, admin_service_1.activityReportAdmin)();
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.activityReport = activityReport;
const listComments = async (req, res) => {
    try {
        const result = await (0, admin_service_1.listCommentsAdmin)({ status: req.query.status });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.listComments = listComments;
const moderateComment = async (req, res) => {
    try {
        const payload = admin_schema_1.commentModerationSchema.parse(req.body);
        const result = await (0, admin_service_1.moderateCommentAdmin)(req.params.id, payload, req.user.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.moderateComment = moderateComment;
const listConflicts = async (req, res) => {
    try {
        const result = await (0, admin_service_1.listConflictsAdmin)(req.query);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.listConflicts = listConflicts;
const updateConflict = async (req, res) => {
    try {
        const payload = admin_schema_1.reportUpdateSchema.parse(req.body);
        const result = await (0, admin_service_1.updateConflictAdmin)(req.params.id, payload, req.user.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateConflict = updateConflict;
const auditLogs = async (_req, res) => {
    try {
        const items = await (0, admin_service_1.listAuditLogs)();
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.auditLogs = auditLogs;
