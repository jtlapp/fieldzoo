module.exports = {
  ...require("../node/jest-preset.js"),
  transform: { "\\.[jt]s?$": ["ts-jest", { tsconfig: { allowJs: true } }] },
  transformIgnorePatterns: ["node_modules/"],
  moduleNameMapper: {
    "(.+)\\.js": "$1",
  },
  extensionsToTreatAsEsm: [".ts"],
};
