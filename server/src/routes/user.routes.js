const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { getProfile, updateProfile } = require("../controllers/user.controller");

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;
