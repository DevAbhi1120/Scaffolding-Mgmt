const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");
const {
  authMiddleware,
  checkSuperAdmin,
  checkAdmin,
} = require("../middleware/auth.middleware");

router.use(authMiddleware);

router.post("/", checkAdmin, customerController.create);
router.get("/", checkAdmin, customerController.getAll); // or allow all authenticated
router.get("/search", customerController.search);
router.patch(
  "/:id/package",
  checkSuperAdmin,
  customerController.upgradePackage
);
router.put("/:id", checkAdmin, customerController.update);
router.delete("/:id", checkSuperAdmin, customerController.delete);

module.exports = router;
