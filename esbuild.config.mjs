import * as esbuild from "esbuild";
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The Anthropic SDK statically imports a few Node built-ins for its
// credential-chain / OAuth / file-upload helpers, which do not exist in a
// WebView. Route every `node:*` import to a browser stub — those code paths
// never run when a plugin talks to the API with an explicit key.
const stubNodeBuiltins = {
  name: "stub-node-builtins",
  setup(build) {
    const stub = path.join(__dirname, "stubs", "node-stub.js");
    build.onResolve({ filter: /^node:/ }, () => ({ path: stub }));
  },
};

function serveUrls(hosts, port) {
  const names = new Set(
    (hosts?.length ? hosts : ["127.0.0.1"]).flatMap((host) => {
      if (host === "0.0.0.0" || host === "::") return ["127.0.0.1"];
      return [host.includes(":") ? `[${host}]` : host];
    }),
  );

  for (const list of Object.values(os.networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.internal || net.family !== "IPv4") continue;
      names.add(net.address);
    }
  }

  return [...names].map((host) => `http://${host}:${port}`);
}

const isServe = process.argv.includes("--serve");

function packZip() {
  execFile(process.execPath, ["./pack-zip.js"], (err, stdout) => {
    if (err) {
      console.error("Error packing zip:", err);
      return;
    }
    console.log(stdout.trim());
  });
}

const zipPlugin = {
  name: "zip-plugin",
  setup(build) {
    build.onEnd(() => {
      packZip();
    });
  },
};

const buildConfig = {
  entryPoints: {
    main: "src/main.js",
  },
  bundle: true,
  minify: !isServe,
  platform: "browser",
  target: ["chrome90"],
  format: "iife",
  logLevel: "info",
  color: true,
  outdir: "dist",
  plugins: [stubNodeBuiltins, zipPlugin],
};

(async function () {
  if (isServe) {
    console.log("Starting development server...");

    const ctx = await esbuild.context(buildConfig);
    await ctx.watch();
    const { hosts, port } = await ctx.serve({
      servedir: ".",
      port: 3000,
    });
    for (const url of serveUrls(hosts, port)) {
      console.log(`Development server: ${url}`);
    }
  } else {
    console.log("Building for production...");
    await esbuild.build(buildConfig);
    console.log("Production build complete.");
  }
})();
