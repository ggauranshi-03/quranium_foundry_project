const { slh } = require("@noble/post-quantum/slh-dsa");
const { shake256 } = require("@noble/hashes/sha3");
const { keccak256 } = require("ethereum-cryptography/keccak");

module.exports = (txData, secretKeyHex) => {
  const txBytes = Buffer.from(txData, "hex");
  const msgHash = keccak256(txBytes);
  const secretKey = Buffer.from(secretKeyHex, "hex");

  const signature = slh.slh_dsa_shake_256f.sign(secretKey, msgHash);
  return Buffer.from(signature).toString("hex");
};
