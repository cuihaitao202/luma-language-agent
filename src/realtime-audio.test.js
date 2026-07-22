import test from "node:test";
import assert from "node:assert/strict";
import { floatToPcm16, resampleMono } from "./realtime-audio.js";

test("resampleMono converts 48 kHz chunks to 16 kHz", () => {
  const input = new Float32Array(4800).fill(0.25);
  const output = resampleMono(input, 48000, 16000);
  assert.equal(output.length, 1600);
  assert.ok(Math.abs(output[800] - 0.25) < 0.001);
});

test("floatToPcm16 clamps input safely", () => {
  assert.deepEqual(Array.from(floatToPcm16(new Float32Array([-2, -1, 0, 1, 2]))), [-32768, -32768, 0, 32767, 32767]);
});
