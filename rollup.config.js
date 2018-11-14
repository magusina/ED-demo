import typescript from "rollup-plugin-typescript2";
import resolve from "rollup-plugin-node-resolve";
import * as meta from "./package.json";

const config = {
  input: "src/index.ts",
  external: [
    ...Object.keys(meta.dependencies || {}),
    ...Object.keys(meta.peerDependencies || {})
  ],
  output: [
    {
      file: `docs/scripts/${meta.name}.js`,
      format: "iife",
      name: `${meta.namespace}`
    }
  ],
  plugins: [
    resolve({
      module: true,
      main: true,
      browser: true,  // Default: false
      modulesOnly: true, // Default: false
    }),
    typescript({
      typescript: require("typescript"),
    })
  ]
};

export default {
  input: config.input,
  output: [ ...config.output ],
  external: [ ...config.external ],
  plugins: [ ...config.plugins ],
}