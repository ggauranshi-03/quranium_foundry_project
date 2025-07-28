// // scripts/deploy.mjs
// import { generateKeypair, signTransaction } from "./slh-utils.mjs";
// import { fetchFromNode } from "./rpc-utils.mjs";

// async function main() {
//   const args = process.argv.slice(2);
//   const bytecode = args[0];
//   const mnemonic = args[1];
//   const rpcUrl = args[2];
//   const chainId = parseInt(args[3]) || 4062024;

//   process.env.QURANIUM_RPC = rpcUrl;
//   console.log("Bytecode length:", bytecode.length);
//   console.log("Bytecode starts with:", bytecode.slice(0, 50));
//   console.log("Bytecode ends with:", bytecode.slice(-50));
//   // Generate keys from mnemonic
//   const keypair = await generateKeypair(mnemonic);
//   console.log("Deploying from address:", keypair.address);

//   // Get account nonce
//   const nonceHex = await fetchFromNode("eth_getTransactionCount", [
//     keypair.address,
//     "latest",
//   ]);
//   const nonce = parseInt(nonceHex, 16);

//   // Get gas price
//   const gasPriceHex = await fetchFromNode("eth_gasPrice");
//   const gasPrice = parseInt(gasPriceHex, 16);

//   // Estimate gas
//   const gasEstimateHex = await fetchFromNode("eth_estimateGas", [
//     {
//       from: keypair.address,
//       data: bytecode.startsWith("0x") ? bytecode : "0x" + bytecode,
//     },
//   ]);
//   const gasLimit = parseInt(gasEstimateHex, 16);

//   const transaction = {
//     from: keypair.address,
//     nonce: nonce,
//     gasPrice: gasPrice,
//     gasLimit: gasLimit,
//     to: null,
//     value: "",
//     data: bytecode,
//     chainId: 4062024,
//   };

//   const rawTx = await signTransaction(transaction, {
//     secretKey: keypair.secretKey,
//     publicKey: keypair.publicKey,
//   });

//   const txHash = await fetchFromNode("eth_sendRawTransaction", [rawTx]);
//   console.log("Transaction sent, hash:", txHash);

//   // Wait for receipt
//   let receipt;
//   let attempts = 0;
//   while (!receipt && attempts < 30) {
//     // 30 attempts * 2s = 60s timeout
//     attempts++;
//     await new Promise((resolve) => setTimeout(resolve, 2000));
//     receipt = await fetchFromNode("eth_getTransactionReceipt", [txHash]);
//     if (receipt) {
//       console.log("Transaction mined, block:", receipt.blockNumber);
//       if (receipt.status === "0x0") {
//         throw new Error("Transaction failed in block");
//       }
//       break;
//     }
//     console.log("Waiting for transaction confirmation...");
//   }

//   if (!receipt) {
//     throw new Error("Transaction not mined within timeout");
//   }

//   console.log(
//     JSON.stringify({
//       success: true,
//       txHash: txHash,
//       contractAddress: receipt.contractAddress,
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
// scripts/deploy.mjs
import { generateKeypair, signTransaction } from "./slh-utils.mjs";
import { fetchFromNode } from "./rpc-utils.mjs";
function sanitizeRawTx(rawTx) {
  try {
    // 1. Check input type
    if (typeof rawTx !== "string") {
      console.error("Invalid input type:", typeof rawTx);
      throw new Error("Input must be a string");
    }
    // 2. Remove all non-hex characters (except 0x)
    let cleaned = rawTx.replace(/[^0-9a-fx]/gi, "");
    // 3. Ensure 0x prefix exists
    if (!cleaned.startsWith("0x")) {
      if (cleaned.includes("x")) {
        cleaned = "0x" + cleaned.replace(/x/gi, "");
      } else {
        cleaned = "0x" + cleaned;
      }
    } else {
      // Remove any duplicate 0x prefixes
      cleaned = "0x" + cleaned.slice(2).replace(/0x/gi, "");
    }
    // 4. Validate hex characters
    const hexPart = cleaned.slice(2);
    if (!/^[0-9a-f]*$/i.test(hexPart)) {
      console.error("Invalid hex characters in:", cleaned);
      throw new Error("Contains non-hex characters");
    }
    // 5. Verify even length (complete bytes)
    if (hexPart.length % 2 !== 0) {
      console.warn("Odd-length hex, padding with 0");
      cleaned = cleaned.slice(0, 2) + "0" + cleaned.slice(2);
    }
    // 6. Final validation
    if (cleaned === "0x") {
      console.error("Empty transaction after sanitization");
      throw new Error("Empty transaction");
    }
    console.log("Sanitized successfully:", cleaned.length, "chars");
    return cleaned;
  } catch (error) {
    console.error("Sanitization failed:", error.message);
    console.debug("Original input:", rawTx);
    throw error; // Re-throw after logging
  }
}
async function main() {
  const args = process.argv.slice(2);
  // let bytecode = args[0];
  const mnemonic = args[1];
  const rpcUrl = args[2];
  const chainId = parseInt(args[3]) || 4062024;
  const bytecode =
    "0x608060405234801561000f575f5ffd5b50604051610af4380380610af483398181016040528101906100319190610193565b805f908161003f91906103ea565b50506104b9565b5f604051905090565b5f5ffd5b5f5ffd5b5f5ffd5b5f5ffd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6100a58261005f565b810181811067ffffffffffffffff821117156100c4576100c361006f565b5b80604052505050565b5f6100d6610046565b90506100e2828261009c565b919050565b5f67ffffffffffffffff8211156101015761010061006f565b5b61010a8261005f565b9050602081019050919050565b8281835e5f83830152505050565b5f610137610132846100e7565b6100cd565b9050828152602081018484840111156101535761015261005b565b5b61015e848285610117565b509392505050565b5f82601f83011261017a57610179610057565b5b815161018a848260208601610125565b91505092915050565b5f602082840312156101a8576101a761004f565b5b5f82015167ffffffffffffffff8111156101c5576101c4610053565b5b6101d184828501610166565b91505092915050565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061022857607f821691505b60208210810361023b5761023a6101e4565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f6008830261029d7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610262565b6102a78683610262565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f6102eb6102e66102e1846102bf565b6102c8565b6102bf565b9050919050565b5f819050919050565b610304836102d1565b610318610310826102f2565b84845461026e565b825550505050565b5f5f905090565b61032f610320565b61033a8184846102fb565b505050565b5b8181101561035d576103525f82610327565b600181019050610340565b5050565b601f8211156103a25761037381610241565b61037c84610253565b8101602085101561038b578190505b61039f61039785610253565b83018261033f565b50505b505050565b5f82821c905092915050565b5f6103c25f19846008026103a7565b1980831691505092915050565b5f6103da83836103b3565b9150826002028217905092915050565b6103f3826101da565b67ffffffffffffffff81111561040c5761040b61006f565b5b6104168254610211565b610421828285610361565b5f60209050601f831160018114610452575f8415610440578287015190505b61044a85826103cf565b8655506104b1565b601f19841661046086610241565b5f5b8281101561048757848901518255600182019150602085019450602081019050610462565b868310156104a457848901516104a0601f8916826103b3565b8355505b6001600288020188555050505b505050505050565b61062e806104c65f395ff3fe608060405234801561000f575f5ffd5b5060043610610034575f3560e01c8063368b877214610038578063e21f37ce14610054575b5f5ffd5b610052600480360381019061004d919061025c565b610072565b005b61005c610084565b6040516100699190610303565b60405180910390f35b805f90816100809190610529565b5050565b5f805461009090610350565b80601f01602080910402602001604051908101604052809291908181526020018280546100bc90610350565b80156101075780601f106100de57610100808354040283529160200191610107565b820191905f5260205f20905b8154815290600101906020018083116100ea57829003601f168201915b505050505081565b5f604051905090565b5f5ffd5b5f5ffd5b5f5ffd5b5f5ffd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b61016e82610128565b810181811067ffffffffffffffff8211171561018d5761018c610138565b5b80604052505050565b5f61019f61010f565b90506101ab8282610165565b919050565b5f67ffffffffffffffff8211156101ca576101c9610138565b5b6101d382610128565b9050602081019050919050565b828183375f83830152505050565b5f6102006101fb846101b0565b610196565b90508281526020810184848401111561021c5761021b610124565b5b6102278482856101e0565b509392505050565b5f82601f83011261024357610242610120565b5b81356102538482602086016101ee565b91505092915050565b5f6020828403121561027157610270610118565b5b5f82013567ffffffffffffffff81111561028e5761028d61011c565b5b61029a8482850161022f565b91505092915050565b5f81519050919050565b5f82825260208201905092915050565b8281835e5f83830152505050565b5f6102d5826102a3565b6102df81856102ad565b93506102ef8185602086016102bd565b6102f881610128565b840191505092915050565b5f6020820190508181035f83015261031b81846102cb565b905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061036757607f821691505b60208210810361037a57610379610323565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026103dc7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826103a1565b6103e686836103a1565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f61042a610425610420846103fe565b610407565b6103fe565b9050919050565b5f819050919050565b61044383610410565b61045761044f82610431565b8484546103ad565b825550505050565b5f5f905090565b61046e61045f565b61047981848461043a565b505050565b5b8181101561049c576104915f82610466565b60018101905061047f565b5050565b601f8211156104e1576104b281610380565b6104bb84610392565b810160208510156104ca578190505b6104de6104d685610392565b83018261047e565b50505b505050565b5f82821c905092915050565b5f6105015f19846008026104e6565b1980831691505092915050565b5f61051983836104f2565b9150826002028217905092915050565b610532826102a3565b67ffffffffffffffff81111561054b5761054a610138565b5b6105558254610350565b6105608282856104a0565b5f60209050601f831160018114610591575f841561057f578287015190505b610589858261050e565b8655506105f0565b601f19841661059f86610380565b5f5b828110156105c6578489015182556001820191506020850194506020810190506105a1565b868310156105e357848901516105df601f8916826104f2565b8355505b6001600288020188555050505b50505050505056fea2646970667358221220c1b85ac9babdb86bc364b4c9e12ed9c53ccf69b45c29583e7bf23a38de9c05d764736f6c634300081e0033";
  process.env.QURANIUM_RPC = rpcUrl;

  // Generate keys from mnemonic
  const keypair = await generateKeypair(mnemonic);
  console.log("Deploying from address:", keypair.address);

  // Get account nonce (as hex string)
  const nonce = await fetchFromNode("eth_getTransactionCount", [
    keypair.address,
    "latest",
  ]);
  console.log("Nonce:", nonce);

  // Get gas price (as hex string)
  const gasPrice = await fetchFromNode("eth_gasPrice");
  console.log("Gas Price:", gasPrice);

  // Estimate gas (as hex string)
  const gasEstimate = await fetchFromNode("eth_estimateGas", [
    {
      from: keypair.address,
      data: bytecode,
    },
  ]);
  console.log("Estimated Gas:", gasEstimate);
  // Add 30% buffer to gas estimate for signature overhead
  const baseGas = parseInt(gasEstimate, 16);
  const bufferedGas = Math.floor(baseGas * 1.3);
  const adjustedGas = "0x" + bufferedGas.toString(16);
  console.log("Adjusted Gas with 30% buffer:", adjustedGas);

  const transaction = {
    from: keypair.address,
    nonce: nonce,
    gasPrice: gasPrice,
    gasLimit: adjustedGas,
    to: null,
    value: "0x",
    data: bytecode,
    chainId: 4062024,
  };

  console.log("Transaction prepared:", {
    nonce: transaction.nonce,
    gasPrice: transaction.gasPrice,
    gasLimit: transaction.gasLimit,
    value: transaction.value,
    data: transaction.data.slice(0, 50) + "..." + transaction.data.slice(-50),
  });

  const rawTx = await signTransaction(transaction, {
    secretKey: keypair.secretKey,
    publicKey: keypair.publicKey,
  });
  console.log("rawtx size", rawTx.length);
  const sanitizerawtx = sanitizeRawTx(rawTx);
  const txHash = await fetchFromNode("eth_sendRawTransaction", [sanitizerawtx]);
  console.log("Transaction sent, hash:", txHash);

  // Wait for receipt (with improved logging)
  let receipt;
  let attempts = 0;
  while (!receipt && attempts < 50) {
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(`Checking receipt (attempt ${attempts})...`);
    receipt = await fetchFromNode("eth_getTransactionReceipt", [txHash]);

    if (receipt) {
      console.log("Transaction mined, block:", receipt.blockNumber);
      if (receipt.status === "0x0") {
        throw new Error("Transaction failed in block");
      }
      break;
    }
  }

  if (!receipt) {
    throw new Error("Transaction not mined within 60 seconds");
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
