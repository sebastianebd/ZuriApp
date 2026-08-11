import { STAFF_AUDIT_FIELDS } from "../models/staff.model";
import { REPLACEMENT_AUDIT_FIELDS } from "../models/replacement.model";
import { TURN_TYPE_AUDIT_FIELDS } from "../models/turn-type.model";
import { TURN_SIGLA_AUDIT_FIELDS } from "../models/turn-sigla.model";
import { ACCOUNT_AUDIT_FIELDS } from "../models/account.model";
import { ROLE_AUDIT_FIELDS } from "../models/role.model";
import { POSITION_AUDIT_FIELDS } from "../models/position.model";
/**
 * Registry of auditable fields per model.
 * Any field not present in this list will be ignored during audit diff generation.
 */
export const AUDIT_WHITELISTS = {
  Staff: STAFF_AUDIT_FIELDS,
  Replacement: REPLACEMENT_AUDIT_FIELDS,
  TurnType: TURN_TYPE_AUDIT_FIELDS,
  TurnSigla: TURN_SIGLA_AUDIT_FIELDS,
  Account: ACCOUNT_AUDIT_FIELDS,
  Role: ROLE_AUDIT_FIELDS,
  Position: POSITION_AUDIT_FIELDS,
};

export type AuditModelName = keyof typeof AUDIT_WHITELISTS;
