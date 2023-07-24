import { PermissionsTable } from "@fieldzoo/permissions-table";
import { AccessLevel } from "@fieldzoo/general-model";
import { UserID } from "@fieldzoo/system-model";

import { GlossaryID } from "../values/glossary-id";

export const glossaryPermissionsTable = new PermissionsTable({
  maxPublicPermissions: AccessLevel.Read,
  maxUserGrantedPermissions: AccessLevel.Grant,
  userTable: "users",
  userIDColumn: "id",
  userIDDataType: "text",
  resourceTable: "glossaries",
  resourceIDColumn: "id",
  resourceIDDataType: "text",
  sampleUserID: "" as UserID,
  sampleResourceID: "" as GlossaryID,
});
