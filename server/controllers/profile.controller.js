const profileService = require("../services/profile.service");

async function getReplacementStats(req, res) {
  try {
    const userId = req.user.id; // Asumiendo que el middleware de auth pone el id en req.user.id
    const stats = await profileService.getUserReplacementStats(userId);
    res.json(stats);
  } catch (error) {
    res
      .status(500)
      .json({
        mensaje: error.message || "Error al obtener estadísticas de reemplazos",
      });
  }
}

async function getServiceStats(req, res) {
  try {
    const userId = req.user.id;
    const stats = await profileService.getUserServiceStats(userId);
    res.json(stats);
  } catch (error) {
    res
      .status(500)
      .json({
        mensaje: error.message || "Error al obtener estadísticas de servicios",
      });
  }
}

async function getRecentActivity(req, res) {
  try {
    const userId = req.user.id;
    const activities = await profileService.getUserRecentActivity(userId);
    res.json(activities);
  } catch (error) {
    res
      .status(500)
      .json({
        mensaje: error.message || "Error al obtener actividad reciente",
      });
  }
}

module.exports = {
  getReplacementStats,
  getServiceStats,
  getRecentActivity,
};
