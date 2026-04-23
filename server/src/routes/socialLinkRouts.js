const express = require("express");
const SocialLink = require("../models/socialLink");

const router = express.Router();

router.get("/", async (_req, res) => {
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

    return res.json({ ok: true, data: payload });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

module.exports = router;
