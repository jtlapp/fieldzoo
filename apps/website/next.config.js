// first load and validate environment variables
const { loadAndValidateEnvFile } = require("@fieldzoo/app-config");

loadAndValidateEnvFile();
module.exports = {
  reactStrictMode: true,
};
