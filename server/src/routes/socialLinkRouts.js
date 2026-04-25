const express = require("express");
const SocialLink = require("../models/socialLink");
const { success } = require("../utils/apiResponse");

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

module.exports = router;
