import { USER_AUDIT_FIELDS } from "../models/user.model";
import { REPLACEMENT_AUDIT_FIELDS } from "../models/replacement.model";
import { TURN_TYPE_AUDIT_FIELDS } from "../models/turn-type.model";
import { TURN_SIGLA_AUDIT_FIELDS } from "../models/turn-sigla.model";
import { CARGO_AUDIT_FIELDS } from "../models/cargo.model";

/**
 * Registry of auditable fields per model.
 * Any field not present in this list will be ignored during audit diff generation.
 */
export const AUDIT_WHITELISTS = {
  User: USER_AUDIT_FIELDS,
  Replacement: REPLACEMENT_AUDIT_FIELDS,
  TurnType: TURN_TYPE_AUDIT_FIELDS,
  TurnSigla: TURN_SIGLA_AUDIT_FIELDS,
  Cargo: CARGO_AUDIT_FIELDS,
};

export type AuditModelName = keyof typeof AUDIT_WHITELISTS;
