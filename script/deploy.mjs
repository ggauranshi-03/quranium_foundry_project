// scripts/deploy.mjs
import { generateKeypair, signTransaction } from "./slh-utils.mjs";
import { fetchFromNode } from "./rpc-utils.mjs";

async function main() {
  const args = process.argv.slice(2);
  const bytecode = args[0];
  const mnemonic = args[1];
  const rpcUrl = args[2];
  const chainId = parseInt(args[3]) || 4062024;

  process.env.QURANIUM_RPC = rpcUrl;

  // Generate keys from mnemonic
  const keypair = await generateKeypair(mnemonic);
  console.log("Deploying from address:", keypair.address);

  // Get account nonce
  const nonceHex = await fetchFromNode("eth_getTransactionCount", [
    keypair.address,
    "latest",
  ]);
  const nonce = parseInt(nonceHex, 16);

  // Get gas price
  const gasPriceHex = await fetchFromNode("eth_gasPrice");
  const gasPrice = parseInt(gasPriceHex, 16);

  // Estimate gas
  const gasEstimateHex = await fetchFromNode("eth_estimateGas", [
    {
      from: keypair.address,
      data: bytecode.startsWith("0x") ? bytecode : "0x" + bytecode,
    },
  ]);
  const gasLimit = parseInt(gasEstimateHex, 16);

  const transaction = {
    nonce: nonce,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
    to: null,
    value: 0,
    data: bytecode.startsWith("0x") ? bytecode : "0x" + bytecode,
    chainId: chainId,
    from: keypair.address,
  };

  const rawTx = await signTransaction(transaction, {
    secretKey: keypair.secretKey,
    publicKey: keypair.publicKey,
  });

  const txHash = await fetchFromNode("eth_sendRawTransaction", [rawTx]);
  console.log("Transaction sent, hash:", txHash);

  // Wait for receipt
  let receipt;
  while (!receipt) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    receipt = await fetchFromNode("eth_getTransactionReceipt", [txHash]);
    if (receipt) {
      console.log("Transaction mined, block:", receipt.blockNumber);
    }
  }

  console.log(
    JSON.stringify({
      success: true,
      txHash: txHash,
      contractAddress: receipt.contractAddress,
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
