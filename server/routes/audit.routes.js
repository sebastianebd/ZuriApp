const express = require("express");
const router = express.Router();
const auditController = require("../controllers/audit.controller");

// GET /api/audit
router.get("/", auditController.getAuditLogs);

module.exports = router;
