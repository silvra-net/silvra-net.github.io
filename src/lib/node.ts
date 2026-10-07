import { useSyncExternalStore } from "react";

/** The public node's status endpoint. Same origin the explorer reads, and the only place these
 *  numbers come from — nothing here is cached or precomputed on our side. */
export const NODE = "https://node.silvra.net";

export interface NodeStatus {
  version: string;
  height: number;
  peer_count: number;
  mempool_size: number;
  is_syncing: boolean;
}

export interface NodeState {
  status: NodeStatus | null;
  failed: boolean;
}

/*
  One poll for the whole page. The gate, the Helix hero and the testnet panel all show the same
  height; three components polling on their own would triple the requests and could briefly
  show three different numbers for the same chain.
*/
let state: NodeState = { status: null, failed: false };
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function emit(next: NodeState) {
  state = next;
  listeners.forEach((l) => l());
}

async function load() {
  try {
    const res = await fetch(`${NODE}/status`);
    if (!res.ok) throw new Error(String(res.status));
    emit({ status: (await res.json()) as NodeStatus, failed: false });
  } catch {
    // A node that cannot be reached is reported as such rather than as a frozen number: a stale
    // height that looks live is worse than an honest gap.
    emit({ status: null, failed: true });
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    void load();
    timer = setInterval(load, 10_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
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
