// Browser stubs for the Node built-ins the Anthropic SDK imports for its
// credential-chain, OAuth and file-upload helpers. None of those paths run in
// the Acode WebView (we always pass an explicit API key and never upload files
// or use `ant auth` profiles), so these only need to exist at bundle time.
// The two primitives that could plausibly be touched — random UUIDs / bytes —
// are backed by the Web Crypto API so they stay correct if ever called.

export const randomUUID = () =>
  globalThis.crypto?.randomUUID?.() ??
  "00000000-0000-4000-8000-000000000000";

export const randomBytes = (n = 0) => {
  const a = new Uint8Array(n);
  globalThis.crypto?.getRandomValues?.(a);
  return a;
};

export const createHash = () => {
  const api = { update: () => api, digest: () => "" };
  return api;
};

export const constants = {};
export class Readable {}
export const pipeline = async () => {};
export const promisify = (fn) => fn;
export const promises = {};

// Common path helpers, in case a namespace import is exercised at runtime.
export const join = (...p) => p.filter(Boolean).join("/");
export const dirname = (p = "") => p.replace(/\/[^/]*$/, "");
export const basename = (p = "") => p.split("/").pop();
export const resolve = (...p) => p.filter(Boolean).join("/");

const stub = {
  randomUUID,
  randomBytes,
  createHash,
  constants,
  Readable,
  pipeline,
  promisify,
  promises,
  join,
  dirname,
  basename,
  resolve,
};

export default stub;
