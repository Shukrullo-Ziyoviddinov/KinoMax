const { success } = require("../utils/apiResponse");

const getProfile = async (req, res, next) => {
  try {
    const user = req.user;
    return success(res, {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar || null,
    });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, avatar } = req.body || {};

    if (typeof firstName === "string") req.user.firstName = firstName.trim();
    if (typeof lastName === "string") req.user.lastName = lastName.trim();
    if (avatar !== undefined) req.user.avatar = avatar || null;

    await req.user.save();

    return success(res, {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      phone: req.user.phone,
      avatar: req.user.avatar || null,
    }, "Profil muvaffaqiyatli yangilandi.");
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
