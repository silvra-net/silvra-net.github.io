import { useSyncExternalStore } from "react";
import { prefersReducedMotion, subscribeMotion } from "./motion";

/** The public node. The only place the site's numbers come from — nothing here is cached or
 *  precomputed on our side, and the node answers browsers directly (CORS is open). */
export const NODE = "https://node.silvra.net";

export interface NodeStatus {
  version: string;
  height: number;
  best_hash: string;
  peer_count: number;
  mempool_size: number;
  is_syncing: boolean;
  total_accounts?: number;
  circulating_supply_hlx?: number;
  total_burned_hlx?: number;
  base_fee_per_byte?: number;
  protocol_version?: number;
}

/** A block as the node's display view returns it. */
export interface SeenBlock {
  height: number;
  hash: string;
  /** Milliseconds since the epoch, from the block itself. */
  timestamp: number;
  tx_count: number;
  validator: string;
}

export interface NodeState {
  status: NodeStatus | null;
  failed: boolean;
  /** Active validators, from /validators; null until the first answer. */
  validators: number | null;
  /** Newest first, consecutive, straight from the chain. Filled only while a block stream is
   *  on screen — the gate needs a height, not a block history. */
  blocks: SeenBlock[];
  /** Seconds per block, from the timestamps of the blocks above; null until two are known. */
  blockTime: number | null;
}

/*
  One poll for the whole page. The gate, the Helix hero, the block stream and the testnet panel
  all show the same height; components polling on their own would multiply the requests and
  could briefly show different numbers for the same chain.

  Blocks come every two seconds, so the status is asked for every three — often enough that the
  height visibly moves, rare enough to be a light load on the node. A hidden tab asks for
  nothing: nobody is looking. Nor does a page that stands still, whether by the "Bewegung
  anhalten" switch or by the OS setting it starts from: WCAG 2.2.2 counts numbers that update
  themselves as moving content, so after the first reading they hold still until motion is
  switched back on.

  A request that takes longer than four seconds is given up, and only one status request is ever
  out at a time, so a slow node is not buried under a queue of them. One miss can be a dropped
  packet; two in a row mean the node is down, and only then does the page say so.
*/
const STATUS_EVERY = 3_000;
const VALIDATORS_EVERY = 30_000;
const KEEP_BLOCKS = 14;
const TIMEOUT = 4_000;
const MISSES_TO_FAIL = 2;

let state: NodeState = { status: null, failed: false, validators: null, blocks: [], blockTime: null };
const listeners = new Set<() => void>();
let statusTimer: ReturnType<typeof setInterval> | undefined;
let validatorTimer: ReturnType<typeof setInterval> | undefined;
let streamWanted = 0;
let inFlight = false;
let misses = 0;

function emit(patch: Partial<NodeState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

const hidden = () => typeof document !== "undefined" && document.visibilityState === "hidden";
/** Pauses whenever the switch shows paused — the page's own choice, or else the OS setting — so
 *  the switch and the numbers always agree. */
const paused = () => prefersReducedMotion();

const get = (path: string) => fetch(`${NODE}${path}`, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT) });

async function loadStatus() {
  if (inFlight || hidden() || (paused() && state.status)) return;
  inFlight = true;
  try {
    const res = await get("/status");
    if (!res.ok) throw new Error(String(res.status));
    const status = (await res.json()) as NodeStatus;
    misses = 0;
    emit({ status, failed: false });
    if (streamWanted > 0) await loadBlocks(status.height);
  } catch {
    // A node that cannot be reached is reported as such rather than as a frozen number: a stale
    // height that looks live is worse than an honest gap.
    misses += 1;
    if (misses >= MISSES_TO_FAIL) emit({ status: null, failed: true });
  } finally {
    inFlight = false;
  }
}

/** Fetch whatever blocks the stream does not have yet, up to the given height. */
async function loadBlocks(height: number) {
  const known = state.blocks[0]?.height ?? 0;
  if (height <= known) return;
  const from = Math.max(known + 1, height - KEEP_BLOCKS + 1);
  try {
    const res = await get(`/blocks/range?from=${from}&count=${height - from + 1}`);
    if (!res.ok) return;
    const fresh = ((await res.json()) as SeenBlock[])
      .map(({ height: h, hash, timestamp, tx_count, validator }) => ({ height: h, hash, timestamp, tx_count, validator }))
      .sort((a, b) => b.height - a.height);
    const blocks = [...fresh, ...state.blocks.filter((b) => b.height < from)].slice(0, KEEP_BLOCKS);
    const span = blocks.length >= 2 ? (blocks[0].timestamp - blocks[blocks.length - 1].timestamp) / 1000 : 0;
    const blockTime = blocks.length >= 2 && span > 0 ? span / (blocks[0].height - blocks[blocks.length - 1].height) : null;
    emit({ blocks, blockTime });
  } catch {
    /* a missed range is filled by the next one */
  }
}

async function loadValidators() {
  if (hidden() || (paused() && state.validators !== null)) return;
  try {
    const res = await get("/validators");
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { validators?: { active?: boolean }[] };
    const active = (data.validators ?? []).filter((v) => v.active !== false).length;
    emit({ validators: active });
  } catch {
    /* the count is a detail; the status poll reports the node being down */
  }
}

function onVisible() {
  if (!hidden()) {
    void loadStatus();
  }
}

let offMotion: (() => void) | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!statusTimer) {
    void loadStatus();
    void loadValidators();
    statusTimer = setInterval(loadStatus, STATUS_EVERY);
    validatorTimer = setInterval(loadValidators, VALIDATORS_EVERY);
    document.addEventListener("visibilitychange", onVisible);
    // Switching motion back on brings the numbers up to date at once, not at the next tick.
    offMotion = subscribeMotion(() => {
      if (!paused()) {
        void loadStatus();
        void loadValidators();
      }
    });
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && statusTimer) {
      clearInterval(statusTimer);
      clearInterval(validatorTimer);
      statusTimer = validatorTimer = undefined;
      document.removeEventListener("visibilitychange", onVisible);
      offMotion?.();
      offMotion = undefined;
    }
  };
}

export function useNodeStatus(): NodeState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

function subscribeStream(listener: () => void) {
  streamWanted += 1;
  const off = subscribe(listener);
  if (state.status) void loadBlocks(state.status.height);
  return () => {
    streamWanted -= 1;
    off();
  };
}

/** The node state plus a running history of recent blocks, fetched while this is mounted. */
export function useBlockStream(): NodeState {
  return useSyncExternalStore(
    subscribeStream,
    () => state,
    () => state,
  );
}
