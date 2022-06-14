import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodePolyfills from "rollup-plugin-polyfill-node";

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: "src/index.ts",
  output: {
    intro: "const global = globalThis;",
    dir: "dist",
    format: "umd",
    name: "candyMachine",
  },
  plugins: [
    typescript({
      module: "es2015",
    }),
    commonjs({
      extensions: [".js", ".ts"],
    }),
    json(),
    nodePolyfills(),
    resolve({
      preferBuiltins: true,
      extensions: [".js", ".ts"],
    }),
  ],
};
