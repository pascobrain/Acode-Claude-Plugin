import { setSetting } from "./utils.js";
import { exchangeCodeForKey } from "./openrouter.js";

// OpenRouter OAuth PKCE. The user taps "Connect", authorizes in a native
// in-app browser, and the plugin receives a user-scoped key automatically —
// no Anthropic API key to create or paste.

const AUTH_URL = "https://openrouter.ai/auth";
const CALLBACK = "http://localhost/acode-claude-openrouter";
const TIMEOUT_MS = 180000;

function base64url(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomVerifier() {
  const a = new Uint8Array(48);
  if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(a);
  else for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
  return base64url(a);
}

/** PKCE pair; uses S256 when Web Crypto is available, else the `plain` method. */
async function makePkce() {
  const verifier = randomVerifier();
  if (globalThis.crypto?.subtle) {
    try {
      const hash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(verifier),
      );
      return { verifier, challenge: base64url(hash), method: "S256" };
    } catch {
      /* fall through to plain */
    }
  }
  return { verifier, challenge: verifier, method: "plain" };
}

function authUrl(challenge, method) {
  const p = new URLSearchParams({
    callback_url: CALLBACK,
    code_challenge: challenge,
    code_challenge_method: method,
  });
  return `${AUTH_URL}?${p.toString()}`;
}

/**
 * Open the authorization page in a native in-app browser and resolve with the
 * authorization `code` once OpenRouter redirects to the callback URL.
 * Resolves with `null` if the user closes it or it times out.
 */
function captureViaWebview(api, url) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let wv = null;
    let timer = null;

    const settle = async (ok, arg) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        await wv?.destroy();
      } catch {
        /* ignore */
      }
      (ok ? resolve : reject)(arg);
    };

    (async () => {
      try {
        wv = await api.create({
          mode: "fullscreen",
          title: "Sign in with OpenRouter",
          allowNavigation: true,
        });
      } catch (e) {
        return reject(e);
      }

      timer = setTimeout(() => settle(true, null), TIMEOUT_MS);

      wv.on("pageFinished", (_event, data) => {
        const u = (data && data.url) || "";
        if (u.indexOf(CALLBACK) === 0) {
          let code = null;
          try {
            code = new URL(u).searchParams.get("code");
          } catch {
            /* ignore */
          }
          settle(true, code);
        }
      });
      wv.on("closed", () => settle(true, null));

      try {
        await wv.loadURL(url);
      } catch (e) {
        settle(false, e);
      }
    })();
  });
}

/**
 * Run the full OpenRouter sign-in. On success, stores the key, switches the
 * provider to OpenRouter and returns true.
 */
export async function connectOpenRouter() {
  let api = null;
  try {
    api = acode.require("webview");
  } catch {
    /* not available */
  }
  if (!api?.create) {
    acode.require("toast")(
      "One-tap sign-in needs a newer Acode. Update the app, or paste an OpenRouter key in the plugin settings.",
      6000,
    );
    return false;
  }

  const { verifier, challenge, method } = await makePkce();

  let code = null;
  try {
    code = await captureViaWebview(api, authUrl(challenge, method));
  } catch (e) {
    acode.require("toast")(`Sign-in error: ${e?.message || e}`, 5000);
    return false;
  }
  if (!code) {
    acode.require("toast")("OpenRouter sign-in was cancelled.", 3000);
    return false;
  }

  const loader = acode.require("loader");
  loader.create("OpenRouter", "Finishing sign-in…");
  try {
    const key = await exchangeCodeForKey(code, verifier, method);
    setSetting("openrouterKey", key);
    setSetting("provider", "openrouter");
    loader.destroy();
    acode.require("toast")("Connected to OpenRouter ✓", 3000);
    return true;
  } catch (e) {
    loader.destroy();
    acode.require("toast")(e?.message || "Could not complete sign-in.", 5000);
    return false;
  }
}
