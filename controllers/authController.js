const createError = require("http-errors");
const User = require("../Models/User");
const { authSchema } = require("../helpers/validationSchema");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../helpers/jwtHelper");
const client = require('../helpers/redis');

module.exports = {
  register: async (req, res, next) => {
    try {
      //if (!email || !password) throw createError.BadRequest();
      const result = await authSchema.validateAsync(req.body);

      const doesExist = await User.findOne({ email: result.email });
      if (doesExist) throw createError(`${result.email} is already registered`);

      const user = new User(result);

      const savedUser = await user.save();
      const accessToken = await signAccessToken(savedUser.id);
      const refreshToken = await signRefreshToken(savedUser.id);

      res.send({ accessToken, refreshToken });
    } catch (err) {
      if (err.isJoi === true) error.status = 422;
      next(err);
    }
  },
  login: async (req, res, next) => {
    try {
      const result = await authSchema.validateAsync(req.body);
      const user = await User.findOne({ email: result.email });

      if (!user) throw createError.NotFound("User not registered");

      const isMatch = await user.isValidPassword(result.password);
      if (!isMatch)
        throw createError.Unauthorized("Username/Password not valid");

      const accessToken = await signAccessToken(user.id);
      const refreshToken = await signRefreshToken(user.id);

      res.send({ accessToken, refreshToken });
    } catch (err) {
      if (err.isJoi === true)
        return next(createError("Invalid Username/Password"));
      next(err);
    }
  },
  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw createError.BadRequest();
      const userId = await verifyRefreshToken(refreshToken);

      const accessToken = await signAccessToken(userId);
      const refToken = await signRefreshToken(userId);

      res.send({ accessToken: accessToken, refreshToken: refToken });
    } catch (err) {
      next(err);
    }
  },
  logout: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw createError.BadRequest();

      const userId = await verifyRefreshToken(refreshToken);

      client.DEL(userId, (err, val) => {
        if (err) {
          console.error(err.message);
          throw createError.InternalServerError();
        }

        console.log(val);
        res.sendStatus(204);
      });
    } catch (err) {
      next(err);
    }
  },
};
