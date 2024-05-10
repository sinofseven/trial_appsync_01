const {build} = require('esbuild');
const glob = require("glob");

build({
  entryPoints: glob.sync('./resolvers/*.ts'),
  bundle: true,
  sourcemap: "inline",
  sourcesContent: false,
  target: "esnext",
  platform: "node",
  format: "esm",
  external: [
    "@aws-appsync/utils"
  ],
  outdir: "dist/"
});