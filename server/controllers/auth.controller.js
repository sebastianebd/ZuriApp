const authService = require("../services/auth.service");

async function login(req, res) {
  try {
    const tokens = await authService.login(req.body);
    res
      .cookie("refresh_token", tokens.refreshToken, {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      })
      .json({ access_token: tokens.accessToken });
  } catch (error) {
    res.status(error.status || 500).json({ mensaje: error.message });
  }
}

async function logout(req, res) {
  try {
    await authService.logout(req.cookies.refresh_token);
    res.clearCookie("refresh_token", {
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
    });
    res.sendStatus(204);
  } catch (error) {
    res.status(error.status || 500).json({ mensaje: error.message });
  }
}

async function refresh(req, res) {
  try {
    const token = await authService.refresh(req.cookies.refresh_token);
    res.json({ access_token: token });
  } catch (error) {
    res.status(error.status || 401).json({ mensaje: error.message });
  }
}

async function user(req, res) {
  res.status(200).json(req.user);
}

module.exports = { login, logout, refresh, user };
