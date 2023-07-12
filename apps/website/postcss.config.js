import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    tailwindcss: {
      config: path.resolve(__dirname, "./tailwind.config.js"),
    },
    autoprefixer: {},
  },
};
