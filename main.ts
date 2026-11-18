// Dip-bounce cbBTC bot — btc-race-24h-20261118-1444.
//
// Long-only dip-bounce, tuned on this kit's dev window (grade-local, driver
// process). The dev window is a slow bleed (BTC 65,083 -> 63,261, buy-hold
// -2.80%), so the shallow dips of the stock recipe lose: DIP 160 gives
// -$27.75 and DIP 120 -$24.91. Only deep, selective dips win here, and the
// bounce must be ridden past +80 bps to pay: DIP 240 / TAKE 120 scores
// +$17.91 with 5 trades, and the 230-250 plateau all scores above +$12.98,
// so 240 is a broad middle, not a spike. DIP 280 never fires (0 trades).
// Final: buy all-in at >=240 bps below the trailing 420-bar high, after a
// 31-bar cooldown since the last sell; exit the whole position on an 80 bps
// trailing stop, a -2% hard stop, a +120 bps take-profit, or a 360-bar hold.
// Deterministic: no clock, no randomness, no network, no files — every
// decision comes from the bars in the batch.
//
// Amounts are bigints: prices at price_scale 5, cash in micro-USDC.

import { runBars } from "./vendor/makefun-bars.ts";
import type { BarsState, Batch, OrderInput } from "./vendor/makefun-bars.ts";

const SYMBOL = "CBBTC";
const LOOKBACK_BARS = 420;
const DIP_BPS = 240;
const TRAIL_BPS = 80;
const STOP_BPS = 200;
const TAKE_BPS = 120;
const MAX_HOLD_BARS = 360;
const COOLDOWN_BARS = 31;
const MAX_SLIPPAGE_BPS = 100;
const BPS_DEN = 10000n;

// --- run state, all derived from the bars and fills seen so far ---
const closes: bigint[] = [];
let pendingBuy = false;
let entryClose = 0n;
let entrySeq = -1;
let peakClose = 0n;
let lastSellSeq = -1000000;

/** Highest close over the last LOOKBACK_BARS closes (fewer while warming up). */
function rollingHigh(): bigint {
  let high = 0n;
  const start = closes.length > LOOKBACK_BARS ? closes.length - LOOKBACK_BARS : 0;
  for (let i = start; i < closes.length; i++) {
    if (closes[i] > high) high = closes[i];
  }
  return high;
}

/** Basis points of `value` below `reference`, truncated; 0 when reference is 0. */
function bpsBelow(reference: bigint, value: bigint): bigint {
  if (reference <= 0n || value >= reference) return 0n;
  return ((reference - value) * BPS_DEN) / reference;
}

/** Basis points of `value` above `reference`, truncated; 0 when reference is 0. */
function bpsAbove(reference: bigint, value: bigint): bigint {
  if (reference <= 0n || value <= reference) return 0n;
  return ((value - reference) * BPS_DEN) / reference;
}

function onBatch(state: BarsState, batch: Batch): OrderInput[] {
  const bar = batch.bars.find((b) => b.symbol === SYMBOL);
  if (bar !== undefined) closes.push(BigInt(bar.c));

  // Fold this batch's fills: a filled or rejected buy clears the pending flag,
  // so a dip that persists never stacks a second buy on top of the first.
  for (const fill of batch.fills) {
    if (fill.symbol !== SYMBOL || fill.side !== "buy") continue;
    if (fill.status === "filled" || fill.status === "rejected") pendingBuy = false;
  }

  if (bar === undefined || state.warmingUp) return [];
  const close = BigInt(bar.c);
  const seq = batch.seq;
  const held = state.positions.get(SYMBOL);
  const qty = held === undefined ? 0n : held.qty;

  // --- exits, while holding the whole position ---
  if (qty > 0n) {
    if (close > peakClose) peakClose = close;
    const heldBars = entrySeq >= 0 ? seq - entrySeq : 0;
    const fellFromPeak = bpsBelow(peakClose, close) >= BigInt(TRAIL_BPS);
    const fellFromEntry = bpsBelow(entryClose, close) >= BigInt(STOP_BPS);
    const roseFromEntry = bpsAbove(entryClose, close) >= BigInt(TAKE_BPS);
    const heldTooLong = heldBars >= MAX_HOLD_BARS;
    if (fellFromPeak || fellFromEntry || roseFromEntry || heldTooLong) {
      lastSellSeq = seq;
      entryClose = 0n;
      entrySeq = -1;
      peakClose = 0n;
      return [{ side: "sell", symbol: SYMBOL, qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
    }
    return [];
  }

  // --- entries, while flat ---
  if (pendingBuy) return [];
  if (seq - lastSellSeq < COOLDOWN_BARS) return [];
  const high = rollingHigh();
  if (high === 0n) return [];
  if (bpsBelow(high, close) < BigInt(DIP_BPS)) return [];
  const cash = state.cash;
  if (cash <= 0n) return [];
  pendingBuy = true;
  entryClose = close;
  entrySeq = seq;
  peakClose = close;
  return [{ side: "buy", symbol: SYMBOL, notional_quote_units: cash, max_slippage_bps: MAX_SLIPPAGE_BPS }];
}

await runBars({ onBatch });
