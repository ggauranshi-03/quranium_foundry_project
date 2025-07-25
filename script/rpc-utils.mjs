// scripts/rpc-utils.mjs
import fetch from "node-fetch";

export async function fetchFromNode(method, params = []) {
  const response = await fetch(process.env.QURANIUM_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: Date.now(),
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(`RPC Error: ${data.error.message}`);
  return data.result;
}
