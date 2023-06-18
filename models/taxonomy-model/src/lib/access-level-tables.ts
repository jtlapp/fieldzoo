import { PermissionsTable } from "@fieldzoo/permissions-table";
import { AccessLevel } from "@fieldzoo/general-model";
import { UserID } from "@fieldzoo/system-model";

import { GlossaryID } from "../values/glossary-id";

export const glossaryPermissionsTable = new PermissionsTable({
  maxPublicPermissions: AccessLevel.Read,
  maxUserGrantedPermissions: AccessLevel.Grant,
  userTable: "user_profiles",
  userIDColumn: "id",
  userIDDataType: "uuid",
  resourceTable: "glossaries",
  resourceIDColumn: "id",
  resourceIDDataType: "text",
  sampleUserID: "" as UserID,
  sampleResourceID: "" as GlossaryID,
});
