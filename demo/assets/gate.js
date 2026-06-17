// Manhaj demo password gate
// ---------------------------
// What this does in plain English:
//   When someone opens any demo page on the public internet, they see a small
//   password prompt. They type the password, the page checks it, and only
//   reveals the demo if it matches. This stops random people who somehow guess
//   the URL from seeing the demo before the school has.
//
// How the check works:
//   We never store the password in this file. We store the *fingerprint* (a
//   "SHA-256 hash" — a one-way scramble of the password). The browser scrambles
//   what the user types the same way and checks if the fingerprints match. If
//   someone reads this file they only see the fingerprint, not the password.
//
// To change the password:
//   1. Open a terminal and run:
//        echo -n "your-new-password" | shasum -a 256
//      You get a 64-character hex string back.
//   2. Replace EXPECTED_HASH below with that string.
//   3. Tell the password to whoever needs to view the demo (separately, by WhatsApp/email).
//
// To disable the gate (e.g. once Cloudflare Access is set up):
//   Remove the <script src="..."> tag for this file from each demo HTML page.
//
// Current default password: "manhaj-demo" (change it before sharing the URL).

(async function manhajGate() {
  // Skip the gate when running locally (localhost / 127.0.0.1 / file://)
  if (
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.protocol === 'file:' ||
    location.hostname === ''
  ) return;

  // Already unlocked in this browser tab session? Don't re-prompt.
  if (sessionStorage.getItem('manhaj_unlocked') === 'true') return;

  const EXPECTED_HASH = 'a832425129345092235d032fb188de9294cdebda6a9bf0cf65db757c654e350d'; // = sha256("manhaj-demo")

  // Hash a string with SHA-256 using the browser's built-in WebCrypto API
  async function sha256(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Hide page contents until unlocked. Safe even before <body> exists because
  // documentElement (the <html> element) is created during DOCTYPE parsing.
  document.documentElement.style.visibility = 'hidden';

  // The overlay needs <body> to attach to. If gate.js loads from <head>,
  // body doesn't exist yet — wait for DOM-ready before building it.
  let overlay;  // hoisted so tryUnlock can remove() it via closure
  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed; inset:0; background:linear-gradient(135deg,#0B2545,#3D5A80);
      display:flex; align-items:center; justify-content:center; z-index:99999;
      font-family:-apple-system,system-ui,"Helvetica Neue",sans-serif;
      visibility:visible;
    `;
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:14px;padding:32px 36px;width:340px;
                  box-shadow:0 20px 60px rgba(15,30,60,.3);text-align:center;">
        <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#0B2545,#3D5A80);
                    display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px;
                    margin:0 auto 16px;">M</div>
        <h2 style="margin:0 0 4px;font-size:18px;color:#0B2545;font-weight:700;">Manhaj preview</h2>
        <p style="margin:0 0 18px;font-size:12.5px;color:#6B7C93;line-height:1.5;">
          This is a private demo. Enter the access password to continue.
        </p>
        <input type="password" id="gate-pw" placeholder="Password" autofocus
               style="width:100%;padding:10px 12px;border:1.5px solid #E5EAF0;border-radius:8px;
                      font-size:13px;font-family:inherit;outline:none;" />
        <div id="gate-err" style="display:none;font-size:11.5px;color:#C53030;margin-top:8px;font-weight:600;">
          Password not recognised. Try again.
        </div>
        <button id="gate-go" style="margin-top:14px;width:100%;padding:10px;background:#0B2545;color:#fff;
                                    border:0;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;
                                    font-family:inherit;">Unlock demo</button>
        <p style="margin:18px 0 0;font-size:10.5px;color:#A0AEC0;line-height:1.5;">
          Pilot: International School of Oman · Confidential.
        </p>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('gate-go').addEventListener('click', tryUnlock);
    document.getElementById('gate-pw').addEventListener('keydown', e => {
      if (e.key === 'Enter') tryUnlock();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildOverlay);
  } else {
    buildOverlay();
  }

  async function tryUnlock() {
    const pw = document.getElementById('gate-pw').value;
    if (!pw) return;
    const hash = await sha256(pw);
    if (hash === EXPECTED_HASH) {
      sessionStorage.setItem('manhaj_unlocked', 'true');
      if (overlay) overlay.remove();
      document.documentElement.style.visibility = 'visible';
    } else {
      const err = document.getElementById('gate-err');
      err.style.display = 'block';
      document.getElementById('gate-pw').value = '';
    }
  }
})();
