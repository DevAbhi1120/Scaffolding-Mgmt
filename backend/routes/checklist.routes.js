const express = require("express");
const router = express.Router();
const safetyChecklistController = require("../controllers/checklists.controller");
const { verifyAdmin } = require("../middleware/auth.middleware");
const checklistUpload = require("../middleware/checklistUpload"); 

router.post(
  "/",
  verifyAdmin,
  checklistUpload.single("photo"),
  safetyChecklistController.createChecklist
);

// ✅ Update checklist
router.put(
  "/:id",
  verifyAdmin,
  checklistUpload.single("photo"),
  safetyChecklistController.updateChecklist
);

// ✅ Get all checklists
router.get("/", verifyAdmin, safetyChecklistController.getAllChecklists);

// ✅ Get single checklist by ID
router.get("/:id", verifyAdmin, safetyChecklistController.getChecklistById);

// ✅ Delete checklist
router.delete("/:id", verifyAdmin, safetyChecklistController.deleteChecklist);

module.exports = router;
