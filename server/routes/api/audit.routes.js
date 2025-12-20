const express = require("express");
const router = express.Router();
const auditController = require("../../controllers/audit.controller");
const authMiddleware = require("../../middleware/authentication.middleware");

router.use(authMiddleware);

// GET /api/audit
router.get("/", auditController.getAuditLogs);

module.exports = router;
