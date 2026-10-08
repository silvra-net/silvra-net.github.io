import { useEffect, useState } from "react";
import { useI18n } from "../i18n";

/** Hex for display. Ciphertext and keys are shown, so they must be shown exactly. */
function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * AES-256-GCM in the visitor's own browser, via WebCrypto.
 *
 * This is a demonstration of what encryption looks like, not of what the messenger does: the
 * app uses MLS with ML-KEM, and the caption says so. Nothing is sent anywhere — the key is
 * generated on load, lives in this component, and never leaves the page.
 */
export default function CryptoDemo() {
  const { t } = useI18n();
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [keyHex, setKeyHex] = useState("");
  const [input, setInput] = useState("");
  const [nonce, setNonce] = useState("");
  const [cipher, setCipher] = useState("");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const k = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
        "encrypt",
        "decrypt",
      ]);
      const raw = await crypto.subtle.exportKey("raw", k);
      if (alive) {
        setKey(k);
        setKeyHex(hex(raw));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!key || !input) {
      setCipher("");
      setNonce("");
      setVerified(false);
      return;
    }
    let alive = true;
    void (async () => {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const data = new TextEncoder().encode(input);
      const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
      // Decrypt straight back: the claim on screen is that this round-trips, so verify it
      // rather than assert it.
      const back = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
      if (!alive) return;
      setNonce(hex(iv.buffer));
      setCipher(hex(ct));
      setVerified(new TextDecoder().decode(back) === input);
    })();
    return () => {
      alive = false;
    };
  }, [key, input]);

  return (
    <div className="terminal">
      <div className="terminal-bar" aria-hidden="true">
        <span className="dot ok" />
        <span className="mono">{t("messenger.crypto.channel")} · AES-256-GCM · WebCrypto</span>
        <span className="terminal-state mono">
          {verified ? t("messenger.crypto.stateVerified") : t("messenger.crypto.stateReady")}
        </span>
      </div>
      <div className="terminal-body">
        <label className="terminal-input">
          <span className="terminal-prompt mono" aria-hidden="true">
            &gt;
          </span>
          <input
            placeholder={t("messenger.crypto.placeholder")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={280}
            aria-label={t("messenger.crypto.placeholder")}
          />
        </label>
        <dl className="terminal-out mono">
          <dt>{t("messenger.crypto.keyLabel")}</dt>
          <dd>{keyHex || "…"}</dd>
          <dt>{t("messenger.crypto.nonceLabel")}</dt>
          <dd>{nonce || "—"}</dd>
          <dt>{t("messenger.crypto.ctLabel")}</dt>
          <dd className="terminal-cipher">{cipher || "—"}</dd>
        </dl>
        <p className={verified ? "terminal-ok" : "terminal-ok idle"} aria-live="polite">
          {verified ? `✓ ${t("messenger.crypto.verified")}` : t("messenger.crypto.waiting")}
        </p>
      </div>
      <p className="terminal-caption">{t("messenger.crypto.caption")}</p>
    </div>
  );
}
