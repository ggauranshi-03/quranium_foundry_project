// scripts/slh-utils.js
import * as slh from "@noble/post-quantum/slh-dsa";
import { mnemonicToEntropy } from "bip39";
import { shake256 } from "@noble/hashes/sha3";
import { keccak256 } from "ethereum-cryptography/keccak";
import { Buffer } from "buffer";
import rlp from "rlp";
// Helper functions (generateKeypair, signTransaction) from your Hardhat script
async function generateKeypair(mnemonic) {
  const entropy = Buffer.from(mnemonicToEntropy(mnemonic), "hex");
  const seed96 = shake256.create({ dkLen: 96 }).update(entropy).digest();
  const keys = slh.slh_dsa_shake_256f.keygen(seed96);
  const originalPublicKey = Buffer.from(keys.publicKey);
  const strippedPubKey = originalPublicKey.subarray(1);
  const publicKeyHash = keccak256(strippedPubKey);
  const addressBytes = publicKeyHash.slice(-20);

  return {
    address: "0x" + Buffer.from(addressBytes).toString("hex"),
    secretKey: keys.secretKey,
    publicKey: keys.publicKey,
  };
}
function hexToBuffer(hexStr) {
  if (hexStr === "") {
    return Buffer.alloc(0);
  }
  let hex = hexStr.startsWith("0x") ? hexStr.slice(2) : hexStr;
  // Pad to even length if needed
  if (hex.length % 2 !== 0) {
    hex = "0" + hex;
  }
  return Buffer.from(hex, "hex");
}

async function signTransaction(transaction, keys) {
  // Helper to ensure minimal hex string with 0x prefix
  const toHex = (val, allowEmpty = false) => {
    if (
      (typeof val === "number" || typeof val === "bigint") &&
      val === 0 &&
      allowEmpty
    )
      return "";
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
  const txFieldsForSigning = [
    toHex(transaction.nonce),
    toHex(transaction.gasPrice),
    toHex(transaction.gasLimit),
    transaction.to ? toHex(transaction.to) : "0x",
    toHex(transaction.value, true),
    toHex(transaction.data),
    toHex(transaction.chainId),
    "0x",
    "0x",
  ];

  const rlpEncoded = rlp.encode(txFieldsForSigning.map(hexToBuffer));
  const msgHash = keccak256(rlpEncoded);

  // Print debug info
  const publicKeyHex = Buffer.from(keys.publicKey).toString("hex");
  const senderAddress = transaction.from.toLowerCase();
  // Derive address from public key (same as generateKeypair)
  const originalPublicKey = Buffer.from(keys.publicKey);
  const strippedPubKey = originalPublicKey.subarray(1);
  const publicKeyHash = keccak256(strippedPubKey);
  const addressBytes = publicKeyHash.slice(-20);
  const derivedAddress = "0x" + Buffer.from(addressBytes).toString("hex");
  console.log("Sender address:", senderAddress);
  console.log("Derived address from public key:", derivedAddress);
  if (senderAddress !== derivedAddress) {
    console.warn(
      "WARNING: Sender address does not match address derived from public key!"
    );
  }
  console.log("Public key (hex, no 0x):", publicKeyHex);
  // console.log("RLP fields for signing:", txFieldsForSigning);
  // console.log(
  //   "RLP-encoded unsigned tx (hex):",
  //   Buffer.from(rlpEncoded).toString("hex")
  // );
  // console.log("Message hash (hex):", Buffer.from(msgHash).toString("hex"));

  // Sign the hash with SLH-DSA
  const signature = slh.slh_dsa_shake_256f.sign(
    keys.secretKey,
    // keys.publicKey,
    msgHash
  );
  console.log("signature size", signature.length);
  const signatureHex = Buffer.from(signature).toString("hex");
  const sig = signatureHex + publicKeyHex;
  // console.log("Signature length:", signature.length);
  // console.log("Public key length:", keys.publicKey.length);
  // console.log("sig+pubkey length:", sig.length / 2);
  // console.log("Signature (hex):", signatureHex);

  // Prepare final tx fields as hex strings
  const txFieldsSigned = [
    toHex(transaction.nonce),
    toHex(transaction.gasPrice),
    toHex(transaction.gasLimit),
    transaction.to ? toHex(transaction.to) : "0x",
    toHex(transaction.value, true),
    toHex(transaction.data),
    "0x" + sig,
    toHex(transaction.chainId),
  ];
  // console.log("RLP fields for sending:", txFieldsSigned);
  const rawTx =
    "0x" + rlp.encode(txFieldsSigned.map(hexToBuffer)).toString("hex");
  return rawTx;
}

export { generateKeypair, signTransaction };
