// scripts/slh-utils.js
// const slh = require("@noble/post-quantum/slh-dsa");
// const { mnemonicToEntropy } = require("bip39");
// const { shake256 } = require("@noble/hashes/sha3");
// const { keccak256 } = require("ethereum-cryptography/keccak");
// const { Buffer } = require("buffer");
// import * as slh from "@noble/post-quantum/slh-dsa";

// // import slh from "@noble/post-quantum/slh-dsa";
// import { mnemonicToEntropy } from "bip39";
// import { shake256 } from "@noble/hashes/sha3";
// import { keccak256 } from "ethereum-cryptography/keccak";
// import { Buffer } from "buffer";
// import rlp from "rlp";


// // Helper functions (generateKeypair, signTransaction) from your Hardhat script
// export async function generateKeypair(mnemonic) {
//   const entropy = Buffer.from(mnemonicToEntropy(mnemonic), "hex");
//   const seed96 = shake256.create({ dkLen: 96 }).update(entropy).digest();
//   const keys = slh.slh_dsa_shake_256f.keygen(seed96);
//   const originalPublicKey = Buffer.from(keys.publicKey);
//   const strippedPubKey = originalPublicKey.subarray(1);
//   const publicKeyHash = keccak256(strippedPubKey);
//   const addressBytes = publicKeyHash.slice(-20);
//   return {
//     address: "0x" + Buffer.from(addressBytes).toString("hex"),
//     secretKey: keys.secretKey, // Keep as Uint8Array
//     publicKey: keys.publicKey, // Keep as Uint8Array
//   };
// }

// export async function signTransaction(transaction, keys) {
//   // Helper to ensure minimal hex string with 0x prefix
//   const toHex = (val, allowEmpty = false) => {
//     if (
//       (typeof val === "number" || typeof val === "bigint") &&
//       val === 0 &&
//       allowEmpty
//     )
//       return "";
//     if (typeof val === "number" || typeof val === "bigint") {
//       if (val === 0) return "0x0";
//       return "0x" + val.toString(16).replace(/^0+/, "0x0");
//     }
//     if (typeof val === "string") {
//       let hex = val.startsWith("0x") ? val.slice(2) : val;
//       hex = hex.replace(/^0+/, "");
//       if (hex === "" && allowEmpty) return "";
//       if (hex === "") return "0x0";
//       return "0x" + hex;
//     }
//     return allowEmpty ? "0x0" : "0x";
//   };

//   // Prepare unsigned tx fields as hex strings
//   const txFieldsForSigning = [
//     toHex(transaction.nonce),
//     toHex(transaction.gasPrice),
//     toHex(transaction.gasLimit),
//     transaction.to ? toHex(transaction.to) : "0x",
//     transaction.value === 0 ? "" : toHex(transaction.value, true),
//     toHex(transaction.data),
//     toHex(transaction.chainId),
//     "0x",
//     "0x",
//   ];

//   const rlpEncoded = rlp.encode(txFieldsForSigning);
//   const msgHash = keccak256(rlpEncoded);

//   // Print debug info
//   const publicKeyHex = Buffer.from(keys.publicKey).toString("hex");
//   const senderAddress = transaction.from.toLowerCase();
//   // Derive address from public key (same as generateKeypair)
//   const originalPublicKey = Buffer.from(keys.publicKey);
//   const strippedPubKey = originalPublicKey.subarray(1);
//   const publicKeyHash = keccak256(strippedPubKey);
//   const addressBytes = publicKeyHash.slice(-20);
//   const derivedAddress = "0x" + Buffer.from(addressBytes).toString("hex");
//   console.log("Sender address:", senderAddress);
//   console.log("Derived address from public key:", derivedAddress);
//   if (senderAddress !== derivedAddress) {
//     console.warn(
//       "WARNING: Sender address does not match address derived from public key!"
//     );
//   }
//   // console.log("Public key (hex, no 0x):", publicKeyHex);
//   // console.log("RLP fields for signing:", txFieldsForSigning);
//   // console.log(
//   //   "RLP-encoded unsigned tx (hex):",
//   //   Buffer.from(rlpEncoded).toString("hex")
//   // );
//   // console.log("Message hash (hex):", Buffer.from(msgHash).toString("hex"));

//   // Sign the hash with SLH-DSA
//   const signature = slh.slh_dsa_shake_256f.sign(
//     keys.secretKey,
//     // keys.publicKey,
//     msgHash
//   );
//   const signatureHex = Buffer.from(signature).toString("hex");
//   const sig = signatureHex + publicKeyHex;
//   console.log("Signature length:", signature.length);
//   console.log("Public key length:", keys.publicKey.length);
//   console.log("sig+pubkey length:", sig.length / 2);
//   console.log("Signature (hex):", signatureHex);

//   // Prepare final tx fields as hex strings
//   const txFieldsSigned = [
//     toHex(transaction.nonce),
//     toHex(transaction.gasPrice),
//     toHex(transaction.gasLimit),
//     transaction.to ? toHex(transaction.to) : "0x",
//     transaction.value === 0 ? "" : toHex(transaction.value, true),
//     toHex(transaction.data),
//     "0x" + sig,
//     toHex(transaction.chainId),
//   ];
//   console.log("RLP fields for sending:", txFieldsSigned);
//   const rawTx = "0x" + rlp.encode(txFieldsSigned).toString("hex");
//   return rawTx;
// }

// // module.exports = { generateKeypair, signTransaction };







import * as slh from "@noble/post-quantum/slh-dsa";
import { mnemonicToEntropy } from "bip39";
import { shake256 } from "@noble/hashes/sha3";
import { keccak256 } from "ethereum-cryptography/keccak";
import { Buffer } from "buffer";
import rlp from "rlp";

/**
 * Try all plausible address derivation conventions based on the public key format.
 * Print all results and return the main result (your “canonical” choice).
 */



export async function generateKeypair(mnemonic) {
  // Step 1: Generate entropy and seed from mnemonic
  const entropy = Buffer.from(mnemonicToEntropy(mnemonic), "hex");
  const seed96 = shake256.create({ dkLen: 96 }).update(entropy).digest();
  const keys = slh.slh_dsa_shake_256f.keygen(seed96);

  // Step 2: Print all key material for forensic debugging
  console.log("\n=== PQ Address Derivation Debug ===");
  console.log("Mnemonic:", mnemonic);
  console.log("Entropy:", entropy.toString("hex"));
  console.log("Seed96:", Buffer.from(seed96).toString("hex"));
  console.log("SLH publicKey (hex):", Buffer.from(keys.publicKey).toString("hex"), "length:", keys.publicKey.length);
  console.log("SLH secretKey (hex, first 32):", Buffer.from(keys.secretKey).toString("hex").slice(0, 64), "full length:", keys.secretKey.length);

  // Step 3: Try different pubkey variants for address derivation
  let pubkey = Buffer.from(keys.publicKey);
  let candidates = [
    { how: "strip first byte if 129", key: pubkey.length === 129 ? pubkey.slice(1) : pubkey },
    { how: "raw key, no strip", key: pubkey },
    { how: "first 64 bytes", key: pubkey.slice(0, 64) },
    { how: "last 64 bytes", key: pubkey.slice(-64) },
  ];

  let chosen = null;

  candidates.forEach(({ how, key }) => {
    let hash = keccak256(key);
    let addrBytes = hash.slice(-20);
    let addr = "0x" + Buffer.from(addrBytes).toString("hex");
    console.log(`${how.padEnd(22)} => pubkey hex: ${key.toString("hex").slice(0, 32)}... len=${key.length} => Addr: ${addr}`);
    // Heuristic: Ethereum standard is usually `strip first byte if 129`
    if (how.startsWith("strip")) chosen = addr;
  });

  console.log("==============================\n");

  // Returns canonical (Ethereum norm) address, plus full keys for further debugging
  return {
    address: chosen,
    secretKey: keys.secretKey, // Uint8Array
    publicKey: keys.publicKey, // Uint8Array
  };
}

// Transaction signing logic — unchanged except with debugging for address match
export async function signTransaction(transaction, keys) {
  const toHex = (val, allowEmpty = false) => {
    if ((typeof val === "number" || typeof val === "bigint") && val === 0 && allowEmpty) return "";
    if (typeof val === "number" || typeof val === "bigint") {
      if (val === 0) return "0x0";
      return "0x" + val.toString(16).replace(/^0+/, "0x0");
    }
    if (typeof val === "string") {
      let hex = val.startsWith("0x") ? val.slice(2) : val;
      hex = hex.replace(/^0+/, "");
      if (hex === "" && allowEmpty) return "";
      if (hex === "") return "0x0";
      return "0x" + hex;
    }
    return allowEmpty ? "0x0" : "0x";
  };

  // Prepare unsigned tx fields as hex strings
  // const txFieldsForSigning = [
  //   toHex(transaction.nonce),
  //   toHex(transaction.gasPrice),
  //   toHex(transaction.gasLimit),
  //   transaction.to ? toHex(transaction.to) : "0x",
  //   transaction.value === 0 ? "" : toHex(transaction.value, true),
  //   toHex(transaction.data),
  //   toHex(transaction.chainId),
  //   "0x",
  //   "0x",
  // ];

  // FOR THE `data` FIELD IN THE RLP ENCODING:
  // const txFieldsForSigning = [
  //   toHex(transaction.nonce),
  //   toHex(transaction.gasPrice),
  //   toHex(transaction.gasLimit),
  //   (transaction.to && transaction.to !== "0x") ? toHex(transaction.to) : "",
  //   transaction.value === 0 ? "" : toHex(transaction.value, true),
  //   // Key line: always pass Buffer for data!
  //   Buffer.from(transaction.data.replace(/^0x/, ""), "hex"),
  //   toHex(transaction.chainId),
  //   "0x",
  //   "0x"
  // ];

  const txFieldsForSigning = [
    BigInt(transaction.nonce),
    BigInt(transaction.gasPrice),
    BigInt(transaction.gasLimit),
    "",  // empty string for contract creation!
    "",  // value 0 for contract deployment
    Buffer.from(transaction.data.replace(/^0x/, ""), "hex"),
    BigInt(transaction.chainId),
    "",
    "",
  ];


  console.log("txFieldsForSigning:", txFieldsForSigning);
  txFieldsForSigning.forEach((val, i) => {
    console.log(`[${i}] (${typeof val})`, val);
  });



  const rlpEncoded = rlp.encode(txFieldsForSigning);
  const msgHash = keccak256(rlpEncoded);

  // Print DEBUG: check address match before signing
  const pk = Buffer.from(keys.publicKey);
  let ethPubkey = pk.length === 129 ? pk.slice(1) : pk;
  const pkHash = keccak256(ethPubkey);
  const derivedAddress = "0x" + Buffer.from(pkHash.slice(-20)).toString("hex");
  const senderAddress = transaction.from.toLowerCase();
  console.log("Sender address:              ", senderAddress);
  console.log("Derived address from pubkey: ", derivedAddress);
  if (senderAddress !== derivedAddress) {
    console.warn("WARNING: Sender address does not match address derived from public key!");
  }

  // Sign message hash with SLH-DSA
  const signature = slh.slh_dsa_shake_256f.sign(keys.secretKey, msgHash);
  const signatureHex = Buffer.from(signature).toString("hex");
  const publicKeyHex = Buffer.from(keys.publicKey).toString("hex");
  const sig = signatureHex + publicKeyHex;

  // Prepare signed tx fields
  // const txFieldsSigned = [
  //   toHex(transaction.nonce),
  //   toHex(transaction.gasPrice),
  //   toHex(transaction.gasLimit),
  //   transaction.to ? toHex(transaction.to) : "0x",
  //   transaction.value === 0 ? "" : toHex(transaction.value, true),
  //   toHex(transaction.data),
  //   "0x" + sig,
  //   toHex(transaction.chainId),
  // ];
  const txFieldsSigned = [
    BigInt(transaction.nonce),
    BigInt(transaction.gasPrice),
    BigInt(transaction.gasLimit),
    (transaction.to && transaction.to !== "0x") ? transaction.to : "",
    "", // value = zero for contract creation
    Buffer.from(transaction.data.replace(/^0x/, ""), "hex"),
    // Here, the signature + pubkey field: this can be either Buffer or hex string, depends on your contract/SERDES logic.
    "0x" + sig,
    BigInt(transaction.chainId),
  ];


  console.log("RLP fields for sending:", txFieldsSigned);
  const rawTx = "0x" + rlp.encode(txFieldsSigned).toString("hex");
  return rawTx;
}



function computeContractAddress(sender, nonce) {
  const senderBuf = Buffer.from(sender.replace(/^0x/, ''), 'hex');
  const rlpEncoded = rlp.encode([senderBuf, nonce]);
  const hash = keccak256(rlpEncoded);
  return '0x' + Buffer.from(hash).slice(-20).toString('hex');
}