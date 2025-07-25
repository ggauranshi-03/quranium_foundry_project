// scripts/deploy.js
const { signTransaction } = require("./slh-utils.mjs");
const { fetchFromNode } = require("./rpc-utils.mjs");

async function main() {
  const args = process.argv.slice(2);
  const nonce = parseInt(args[0]);
  const gasPrice = parseInt(args[1]);
  const gasLimit = parseInt(args[2]);
  const bytecode = args[3];
  const address = args[4];
  const secretKey = Uint8Array.from(Buffer.from(args[5].slice(2), "hex"));
  const publicKey = Uint8Array.from(Buffer.from(args[6].slice(2), "hex"));
  const rpcUrl = args[7];

  process.env.QURANIUM_RPC = rpcUrl;

  const transaction = {
    nonce: nonce,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
    to: null,
    value: 0,
    data: bytecode.startsWith("0x") ? bytecode : "0x" + bytecode,
    chainId: 4062024,
    from: address,
  };

  const rawTx = await signTransaction(transaction, { secretKey, publicKey });
  const txHash = await fetchFromNode("eth_sendRawTransaction", [rawTx]);

  // Return result to Solidity
  console.log(
    JSON.stringify({
      success: true,
      txHash: txHash,
    })
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      success: false,
      error: error.message,
    })
  );
  process.exit(1);
});
