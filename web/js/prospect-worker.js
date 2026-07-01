// Parallel prospect worker — loads WASM once, runs batch scans for a slice.

import init, {
  set_universe,
  prospect_batch_json,
} from "../pkg/lib_of_babel.js";
import { prospectScanChunks } from "./prospect-batch.js";

const ready = init();

let cancelled = false;

self.onmessage = async (msg) => {
  if (msg.data.type === "cancel") {
    cancelled = true;
    return;
  }
  cancelled = false;

  const data = msg.data;
  await ready;
  set_universe(BigInt(data.universeSeed));

  let best = null;
  for (const { best: chunkBest, scanned } of prospectScanChunks({
    batchJson: prospect_batch_json,
    samples: data.samples,
    startIndex: data.startIndex,
    seed: BigInt(data.seed),
    alphabetId: data.alphabetId,
    chunkSize: data.chunkSize,
    shouldCancel: () => cancelled,
  })) {
    best = chunkBest;
    self.postMessage({
      type: "progress",
      workerId: data.workerId,
      scanned,
      best,
    });
  }

  if (cancelled) return;
  self.postMessage({
    type: "done",
    workerId: data.workerId,
    best,
    scanned: data.samples,
  });
};
