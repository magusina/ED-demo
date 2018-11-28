import typescript from "rollup-plugin-typescript2";
import resolve from "rollup-plugin-node-resolve";
import * as meta from "./package.json";

export default [
  {
    input: "src/slide1.ts",
    external: [ "d3" ],
    output: [
      {
        file: `docs/scripts/slide1.js`,
        format: "iife",
        globals: {
          d3: "d3"
        },
        name: `${meta.namespace}`
      }
    ],
    plugins: [
      resolve({ module: true, main: true, browser: true, modulesOnly: true }),
      typescript({ typescript: require("typescript") })
    ]
  },
  {
    input: "src/slide2.ts",
    external: [ "d3" ],
    output: [
      {
        file: `docs/scripts/slide2.js`,
        format: "iife",
        globals: {
          d3: "d3"
        },
        name: `${meta.namespace}`
      }
    ],
    plugins: [
      resolve({ module: true, main: true, browser: true, modulesOnly: true }),
      typescript({ typescript: require("typescript") })
    ]
  },
  {
    input: "src/slide3.ts",
    external: [ "d3" ],
    output: [
      {
        file: `docs/scripts/slide3.js`,
        format: "iife",
        globals: {
          d3: "d3"
        },
        name: `${meta.namespace}`
      }
    ],
    plugins: [
      resolve({ module: true, main: true, browser: true, modulesOnly: true }),
      typescript({ typescript: require("typescript") })
    ]
  },
  {
    input: "src/slide4.ts",
    external: [ "d3" ],
    output: [
      {
        file: `docs/scripts/slide4.js`,
        format: "iife",
        globals: {
          d3: "d3"
        },
        name: `${meta.namespace}`
      }
    ],
    plugins: [
      resolve({ module: true, main: true, browser: true, modulesOnly: true }),
      typescript({ typescript: require("typescript") })
    ]
  }
];