const express = require("express");
const Actor = require("../models/actors");
const { success, fail } = require("../utils/apiResponse");
const { parsePagination, buildPaginationMeta } = require("../utils/pagination");
const { applyPagination, applyProjection } = require("../utils/queryOptimizer");
const { validateIdParam } = require("../middlewares/validateRequest");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const query = { isActive: true };
    const total = await Actor.countDocuments(query);
    const actors = await applyPagination(
      applyProjection(Actor.find(query).sort({ actorId: 1 }), "-__v"),
      pagination
    ).lean();
    return success(res, actors, "Actorlar ro'yxati", 200, buildPaginationMeta(total, pagination));
  } catch (error) {
    return next(error);
  }
});

router.get("/by-ids", async (req, res, next) => {
  try {
    const ids = String(req.query.ids || "")
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isFinite(v));

    if (!ids.length) {
      return success(res, [], "Actorlar topilmadi");
    }

    const actors = await Actor.find({
      actorId: { $in: ids },
      isActive: true,
    })
      .sort({ actorId: 1 })
      .select("-__v")
      .lean();

    return success(res, actors, "Actorlar ro'yxati");
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", validateIdParam("id"), async (req, res, next) => {
  try {
    const actor = await Actor.findOne({ actorId: req.params.id, isActive: true })
      .select("-__v")
      .lean();
    if (!actor) {
      return fail(res, "Actor topilmadi.", 404);
    }

    return success(res, actor, "Actor ma'lumoti");
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { actorId, name, image, info = {}, isActive = true } = req.body || {};

    if (!name?.uz || !name?.ru) {
      return fail(res, "name.uz va name.ru majburiy.");
    }
    if (!image || typeof image !== "string") {
      return fail(res, "image maydoni majburiy.");
    }

    let nextActorId = Number(actorId);
    if (!Number.isFinite(nextActorId) || nextActorId <= 0) {
      const last = await Actor.findOne().sort({ actorId: -1 }).select("actorId").lean();
      nextActorId = Number(last?.actorId || 0) + 1;
    }

    const created = await Actor.create({
      actorId: nextActorId,
      name: {
        uz: String(name.uz).trim(),
        ru: String(name.ru).trim(),
      },
      image: String(image).trim(),
      info: {
        uz: String(info?.uz || "").trim(),
        ru: String(info?.ru || "").trim(),
      },
      isActive: Boolean(isActive),
    });

    return success(res, created, "Aktyor yaratildi", 201);
  } catch (error) {
    if (error?.code === 11000) {
      return fail(res, "Bu actorId allaqachon mavjud.", 409);
    }
    return next(error);
  }
});

module.exports = router;
