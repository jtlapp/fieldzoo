import { DatabaseConfig } from "./database-config";

export const TEST_DB_CONFIG = new DatabaseConfig({
  host: "localhost",
  port: 5432,
  database: "fieldzoo_test",
  user: "test_user",
  password: "test_pass",
});
