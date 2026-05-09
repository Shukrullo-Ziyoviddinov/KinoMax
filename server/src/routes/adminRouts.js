const express = require("express");
const AdminProfile = require("../models/adminProfile");
const AdminLoginLog = require("../models/adminLoginLog");
const { success, fail } = require("../utils/apiResponse");
const bot = require("../bot/bot");
const { sendBroadcastToAll } = require("../bot/handlers/broadcastSender");

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

router.post("/bot-broadcast", async (req, res, next) => {
  try {
    if (!bot) {
      return fail(res, "Bot ishga tushmagan.", 503);
    }

    const title = String(req.body?.title || "").trim();
    const text = String(req.body?.text || "").trim();
    const mediaType = String(req.body?.mediaType || "").trim();
    const mediaDataUrl = String(req.body?.mediaDataUrl || "").trim();
    const buttons = Array.isArray(req.body?.buttons) ? req.body.buttons : [];

    if (!title && !text && !mediaDataUrl) {
      return fail(res, "Kamida title, text yoki media bo'lishi kerak.", 400);
    }
    if (mediaType && !["photo", "video"].includes(mediaType)) {
      return fail(res, "mediaType noto'g'ri.", 400);
    }
    if (mediaDataUrl && !mediaType) {
      return fail(res, "Media turi tanlanmagan.", 400);
    }

    const result = await sendBroadcastToAll(bot, {
      title,
      text,
      mediaType: mediaType || null,
      mediaDataUrl: mediaDataUrl || null,
      buttons,
    });

    return success(res, result, "Reklama yuborildi.");
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
