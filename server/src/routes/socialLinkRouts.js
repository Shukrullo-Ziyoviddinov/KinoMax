const express = require("express");
const SocialLink = require("../models/socialLink");
const { success, fail } = require("../utils/apiResponse");

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    const rows = await SocialLink.find({ isActive: true }).sort({
      type: 1,
      sortOrder: 1,
    });

    const payload = {
      contact: {},
      social: {},
      appStore: {},
    };

    rows.forEach((row) => {
      payload[row.type][row.key] = {
        link: row.link || undefined,
        label: row.label || undefined,
        icon: row.icon || undefined,
        address: row.address || undefined,
      };
    });

    return success(res, payload, "Ijtimoiy linklar");
  } catch (error) {
    return next(error);
  }
});

router.put("/:type", async (req, res, next) => {
  try {
    const type = String(req.params.type || "").trim();
    if (!["contact", "social", "appStore"].includes(type)) {
      return fail(res, "Noto'g'ri type.");
    }

    const rows = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!rows.length) {
      return fail(res, "items bo'sh bo'lmasligi kerak.");
    }

    const operations = rows
      .filter((item) => String(item?.key || "").trim())
      .map((item, idx) => {
        const key = String(item.key).trim();
        return SocialLink.findOneAndUpdate(
          { type, key },
          {
            $set: {
              type,
              key,
              link: String(item.link || "").trim(),
              label: String(item.label || "").trim(),
              icon: String(item.icon || "").trim(),
              address: String(item.address || "").trim(),
              isActive: item.isActive !== false,
              sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : idx + 1,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      });

    const saved = await Promise.all(operations);
    return success(res, saved, "Linklar saqlandi.");
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
