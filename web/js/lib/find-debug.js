// Photo Find console tracing — stalls show as long gaps / heartbeats.
// Enable: ?findDebug=1 · localStorage.babelFindDebug=1 · or localhost / ?dev=1
// Disable even on localhost: babelFindDebug(false) in the console.

import { isDevMode } from "./util.js";

const KEY = "babelFindDebug";
const PREFIX = "[babel find]";
const HEARTBEAT_MS = 2000;

export function isFindDebug() {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "0") return false;
    if (stored === "1") return true;
    if (new URLSearchParams(location.search).has("findDebug")) return true;
  } catch {
    /* private mode */
  }
  return isDevMode();
}

/** Console: `babelFindDebug()` / `babelFindDebug(true)` / `babelFindDebug(false)`. */
export function setFindDebug(on) {
  const next = on !== false;
  try {
    localStorage.setItem(KEY, next ? "1" : "0");
  } catch {
    /* ignore */
  }
  console.info(
    PREFIX,
    next
      ? "on (persisted). Reload not required — next Find will log."
      : "off (persisted).",
  );
  return next;
}

/**
 * Timed phase tracer for one Find run.
 * @param {string} label
 * @param {Record<string, unknown>} [meta]
 */
export function createFindTrace(label, meta = {}) {
  if (!isFindDebug()) {
    return {
      phase() {},
      note() {},
      done() {},
      fail() {},
    };
  }

  const t0 = performance.now();
  let last = t0;
  let phase = "start";
  /** @type {ReturnType<typeof setInterval> | null} */
  let beat = null;

  const ms = (a, b) => `${(b - a).toFixed(0)}ms`;

  const stopBeat = () => {
    if (beat != null) {
      clearInterval(beat);
      beat = null;
    }
  };

  const startBeat = () => {
    stopBeat();
    beat = setInterval(() => {
      const now = performance.now();
      console.info(
        PREFIX,
        `${label} · still in "${phase}"`,
        `+${ms(last, now)} this phase`,
        `(${ms(t0, now)} total)`,
      );
    }, HEARTBEAT_MS);
  };

  console.info(PREFIX, `${label} · start`, meta);
  startBeat();

  return {
    /** @param {string} name @param {Record<string, unknown>} [extra] */
    phase(name, extra) {
      const now = performance.now();
      console.info(
        PREFIX,
        `${label} · ${phase} → ${name}`,
        `+${ms(last, now)}`,
        `(${ms(t0, now)} total)`,
        extra ?? "",
      );
      phase = name;
      last = now;
      startBeat();
    },
    /** @param {string} msg @param {Record<string, unknown>} [extra] */
    note(msg, extra) {
      const now = performance.now();
      console.info(
        PREFIX,
        `${label} · ${msg}`,
        `(${ms(t0, now)} total)`,
        extra ?? "",
      );
    },
    /** @param {Record<string, unknown>} [extra] */
    done(extra) {
      const now = performance.now();
      stopBeat();
      console.info(
        PREFIX,
        `${label} · done`,
        `${ms(t0, now)} total`,
        extra ?? "",
      );
    },
    /** @param {unknown} err */
    fail(err) {
      const now = performance.now();
      stopBeat();
      console.warn(
        PREFIX,
        `${label} · fail after ${ms(t0, now)}`,
        err,
      );
    },
  };
}

try {
  if (typeof window !== "undefined") {
    window.babelFindDebug = (on) => {
      if (on === undefined) {
        const onNow = isFindDebug();
        console.info(
          PREFIX,
          onNow ? "currently on" : "currently off",
          "— babelFindDebug(true|false) to persist",
        );
        return onNow;
      }
      return setFindDebug(!!on);
    };
  }
} catch {
  /* ignore */
}
