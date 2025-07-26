// // scripts/deploy.js
// // const { signTransaction } = require("./slh-utils.mjs");
// import { signTransaction } from "./slh-utils.mjs";
// import { fetchFromNode } from "./rpc-utils.mjs";
// // const { fetchFromNode } = require("./rpc-utils.mjs");

// async function main() {
//   const args = process.argv.slice(2);
//   const nonce = parseInt(args[0]);
//   const gasPrice = parseInt(args[1]);
//   const gasLimit = parseInt(args[2]);
//   const bytecode = args[3];
//   const address = args[4];
//   const secretKey = Uint8Array.from(Buffer.from(args[5].slice(2), "hex"));
//   const publicKey = Uint8Array.from(Buffer.from(args[6].slice(2), "hex"));
//   const rpcUrl = args[7];

//   process.env.QURANIUM_RPC = rpcUrl;

//   const transaction = {
//     nonce: nonce,
//     gasPrice: gasPrice,
//     gasLimit: gasLimit,
//     to: null,
//     value: 0,
//     data: bytecode.startsWith("0x") ? bytecode : "0x" + bytecode,
//     chainId: 4062024,
//     from: address,
//   };

//   const rawTx = await signTransaction(transaction, { secretKey, publicKey });
//   const txHash = await fetchFromNode("eth_sendRawTransaction", [rawTx]);

//   // Return result to Solidity
//   console.log(
//     JSON.stringify({
//       success: true,
//       txHash: txHash,
//     })
//   );
// }

// main().catch((error) => {
//   console.error(
//     JSON.stringify({
//       success: false,
//       error: error.message,
//     })
//   );
//   process.exit(1);
// });







// import { generateKeypair, signTransaction } from './slh-utils.mjs';
// import fetch from "node-fetch"; // npm i node-fetch@^3
// import rlp from "rlp";
// import { keccak256 } from "ethereum-cryptography/keccak";
// import { Buffer } from "buffer";

// // ---- CONFIG ----
// const MNEMONIC = process.env.MNEMONIC || "your mnemonic words here";
// const RPC_URL = process.env.QURANIUM_RPC || "https://tqrn-node1.quranium.org/node"; // set in .env or hardcode
// const BYTECODE = process.argv[6] || "0x..."; // Foundry FFI provides this as an arg

// // Helpers for mining
// async function waitForReceipt(rpc, txHash, maxTries=60, delayMs=2000) {
//   for (let t = 0; t < maxTries; t++) {
//     const res = await fetch(rpc, {
//       method: "POST",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify({
//         jsonrpc: "2.0",
//         method: "eth_getTransactionReceipt",
//         params: [txHash],
//         id: 1
//       })
//     });
//     const { result } = await res.json();
//     if (result) return result;
//     await new Promise(r => setTimeout(r, delayMs));
//   }
//   throw new Error("Timeout: Tx not mined after waiting.");
// }

// // Compute deployed contract address (from deployer + nonce, per Ethereum spec)
// function computeContractAddress(from, nonce) {
//   const addrBuf = Buffer.from(from.replace(/^0x/, ''), 'hex');
//   const rlpEncoded = rlp.encode([addrBuf, nonce]);
//   const hash = keccak256(rlpEncoded);
//   return "0x" + Buffer.from(hash).slice(-20).toString("hex");
// }

// async function main() {
//   // Gather args (change if your Foundry FFI exports different/extra values)
//   const [ , , nonceStr, gasPriceStr, gasLimitStr, bytecode ] = process.argv;
//   const nonce = parseInt(nonceStr, 10);
//   const gasPrice = BigInt(gasPriceStr);
//   const gasLimit = BigInt(gasLimitStr);
//   const keys = await generateKeypair(MNEMONIC);

//   // Build deploy tx
//   const tx = {
//     nonce,
//     gasPrice,
//     gasLimit,
//     to: null, // deploying contract
//     value: 0n,
//     data: bytecode || BYTECODE,
//     chainId: 1, // set QURANIUM chain id if not 1
//     from: keys.address
//   };

//   // Sign and send
//   const rawTx = await signTransaction(tx, keys);

//   // Broadcast the rawTx via JSON-RPC
//   const sendRes = await fetch(RPC_URL, {
//     method: "POST",
//     headers: { "content-type": "application/json" },
//     body: JSON.stringify({
//       jsonrpc: "2.0",
//       method: "eth_sendRawTransaction",
//       params: [rawTx],
//       id: 42
//     }),
//   });
//   const txResult = await sendRes.json();
//   if (!txResult.result) {
//     console.error("eth_sendRawTransaction error:", JSON.stringify(txResult, null, 2));
//     process.exit(1);
//   }
//   const txHash = txResult.result;
//   console.log("Transaction hash:", txHash);

//   // Wait for receipt (mined block)
//   const receipt = await waitForReceipt(RPC_URL, txHash);
//   // Show explorer-visible address
//   console.log("Real deployed contract address:", receipt.contractAddress);
//   console.log("Explorer link: https://explorer.quranium.org/address/" + receipt.contractAddress);

//   // For scripts that parse stdout, output as JSON line
//   process.stdout.write(receipt.contractAddress);
// }

// main();



import { generateKeypair, signTransaction } from './slh-utils.mjs';
import fetch from "node-fetch";
import rlp from "rlp";
import { keccak256 } from "ethereum-cryptography/keccak";
import { Buffer } from "buffer";

// ---- CONFIG ----
const MNEMONIC = process.env.MNEMONIC || "your twelve word mnemonic here";
const RPC_URL = process.env.QURANIUM_RPC || "https://tqrn-node1.quranium.org/node";
const CHAIN_ID = 1; // Set your Quranium chain ID if not 1

async function waitForReceipt(rpc, txHash, maxTries=60, delayMs=2000) {
  for (let t = 0; t < maxTries; t++) {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getTransactionReceipt",
        params: [txHash],
        id: 1
      })
    });
    const { result } = await res.json();
    if (result) return result;
    await new Promise(r => setTimeout(r, delayMs));
  }
  throw new Error("Timeout: Tx not mined after waiting.");
}

async function main() {
  // Foundry FFI args: [node, script, nonce, gasPrice, gasLimit, bytecode, ...]
  let [ , , nonceStr, gasPriceStr, gasLimitStr, bytecodeRaw ] = process.argv;
  const nonce = parseInt(nonceStr, 10);
  const gasPrice = BigInt(gasPriceStr);
  const gasLimit = BigInt(gasLimitStr);

  // Clean up bytecode to be just the hex (no 0x, no newlines)
  const bytecode = (bytecodeRaw || "")
    .replace(/^0x/, "")
    .replace(/\s+/g, "");

  if (!bytecode || !/^[0-9a-fA-F]+$/.test(bytecode)) {
    throw new Error("Invalid bytecode: " + bytecodeRaw);
  }

  const keys = await generateKeypair(MNEMONIC);

  // Contract deploy transactions: to empty, data set.
  const tx = {
    nonce,
    gasPrice,
    gasLimit,
    to: "", // Empty string for contract creation, not "null"
    value: 0n,
    data: "0x" + bytecode,
    chainId: CHAIN_ID,
    from: keys.address
  };

  // --- signTransaction must assemble the transaction with all string/buffer fields normalized!
  const rawTx = await signTransaction(tx, keys);

  // Broadcast via JSON-RPC
  const sendRes = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_sendRawTransaction",
      params: [rawTx],
      id: 42
    }),
  });
  const txResult = await sendRes.json();
  if (!txResult.result) {
    console.error("eth_sendRawTransaction error:", JSON.stringify(txResult, null, 2));
    process.exit(1);
  }
  const txHash = txResult.result;
  console.log("Transaction hash:", txHash);

  // Wait for receipt
  const receipt = await waitForReceipt(RPC_URL, txHash);
  if (!receipt.contractAddress) {
    console.error("No contractAddress in receipt:", JSON.stringify(receipt, null, 2));
    process.exit(2);
  }
  console.log("Real deployed contract address:", receipt.contractAddress);
  console.log("Explorer link: https://explorer.quranium.org/address/" + receipt.contractAddress);

  // For scripts, also print raw contract address ONLY as final output
  process.stdout.write(receipt.contractAddress);
}

main().catch(e => {
  console.error("Fatal error in deploy.mjs:", e);
  process.exit(99);
});
