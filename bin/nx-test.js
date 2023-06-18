const child_process = require("child_process");

const testsToRunSerially = [
  "@fieldzoo/system-model",
  "@fieldzoo/taxonomy-model",
  "installer",
];

const args = process.argv.slice(2);
try {
  child_process.execSync(
    `nx run-many --t test ${args.join(" ")} ${testsToRunSerially.join(",")}`,
    {
      stdio: "inherit",
    }
  );
} catch (e) {
  process.exit(1);
}
