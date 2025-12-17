const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String, // CREAR, MODIFICAR, ELIMINAR, FINALIZAR, ANULAR
      required: true,
      uppercase: true,
    },
    module: {
      type: String, // USUARIOS, REEMPLAZOS
      required: true,
      uppercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // Puede ser objeto o string
      default: null,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Puede ser null si es una acción del sistema o usuario anonimo (ej login fallido)
    },
    user_name: {
      type: String, // Snapshot del nombre para histórico
      required: false,
    },
    resource_id: {
      type: String, // ID del recurso afectado (User ID, Reemplazo ID)
      required: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
