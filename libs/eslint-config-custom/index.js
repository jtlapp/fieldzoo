module.exports = {
  extends: ["next", "turbo", "prettier"],
  rules: {
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-unused-vars": "off"
    // "@next/next/no-html-link-for-pages": "off",
    // "react/jsx-key": "off",
  },
};
