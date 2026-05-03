const express = require("express");
const AdminProfile = require("../models/adminProfile");
const AdminLoginLog = require("../models/adminLoginLog");
const { success, fail } = require("../utils/apiResponse");

const router = express.Router();

/**
 * POST /api/admin/login
 * Body: { firstName, lastName, password }
 * Profilni yangilaydi va kirish tarixiga yozadi.
 */
router.post("/login", async (req, res, next) => {
  try {
    const firstName = String(req.body?.firstName || "").trim();
    const lastName = String(req.body?.lastName || "").trim();
    const password = String(req.body?.password || "");

    if (!firstName || !lastName || !password) {
      return fail(res, "Ism, familiya va parolni to'ldiring.", 400);
    }

    const expectedPassword = String(process.env.ADMIN_PASSWORD || "").trim();
    if (!expectedPassword) {
      return fail(res, "Server sozlamalari to'liq emas.", 503);
    }

    if (password !== expectedPassword) {
      return fail(res, "Parol noto'g'ri.", 401);
    }

    const now = new Date();
    const profile = await AdminProfile.findOneAndUpdate(
      { key: "default" },
      { $set: { firstName, lastName, lastLoginAt: now } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await AdminLoginLog.create({
      firstName,
      lastName,
      ip: req.ip || "",
      userAgent: req.get("user-agent") || "",
    });

    return success(
      res,
      {
        firstName: profile.firstName,
        lastName: profile.lastName,
        lastLoginAt: profile.lastLoginAt,
      },
      "Muvaffaqiyatli kirildi"
    );
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/admin/profile
 * Oxirgi saqlangan admin profili (parolsiz).
 */
router.get("/profile", async (req, res, next) => {
  try {
    const profile = await AdminProfile.findOne({ key: "default" }).lean();
    if (!profile) {
      return success(res, null, "Profil hali yo'q");
    }
    return success(res, {
      firstName: profile.firstName,
      lastName: profile.lastName,
      lastLoginAt: profile.lastLoginAt,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
