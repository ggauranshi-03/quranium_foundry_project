// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script} from "forge-std/Script.sol";
import {SLH} from "../src/SLH.sol";
import {HelloWorld} from "../src/HelloWorld.sol";
import {console2} from "forge-std/console2.sol";

contract QuraniumDeployer is Script {
    using SLH for SLH.KeyPair;

    bytes public constant SLH_PUBKEY =
        "0xe69c12d9355046aa89c386211ad146895daa1050ecad68a808696e2b9bd044e4a5b4a0d28344779a2fd32c6056d434e714a0eb75e055b7594e6401f9504be5b7";
    bytes public constant SLH_SECRET =
        "0xe0c2369ac6819331db4d63151f30bbec83b922eaba5dfc7a74c5e786aa355d4e893ce3a30db4601a0923bc6fa704363f174b23391f325617356eae4c7fc7db5fe69c12d9355046aa89c386211ad146895daa1050ecad68a808696e2b9bd044e4a5b4a0d28344779a2fd32c6056d434e714a0eb75e055b7594e6401f9504be5b7";

    // Define RPC URL alias as constant
    string public constant RPC_ALIAS = "quranium";

    function run() external {
        string memory rpcUrl = vm.rpcUrl(RPC_ALIAS);

        SLH.KeyPair memory keypair = SLH.KeyPair({
            addr: SLH.deriveAddress(SLH_PUBKEY),
            secretKey: SLH_SECRET,
            publicKey: SLH_PUBKEY
        });

        uint256 nonce = getNonce(keypair.addr, rpcUrl);
        uint256 gasPrice = getGasPrice(rpcUrl);
        uint256 gasLimit = 5_000_000;
        string memory initialMessage = "Hello Quranium!";

        // Prepare deployment transaction
        bytes memory bytecode = abi.encodePacked(
            type(HelloWorld).creationCode,
            abi.encode(initialMessage)
        );

        // Build transaction parameters for signing
        string[] memory ffiCmd = new string[](10);
        ffiCmd[0] = "node";
        ffiCmd[1] = "script/deploy.mjs"; // Use the Hardhat deployment script
        ffiCmd[2] = vm.toString(nonce);
        ffiCmd[3] = vm.toString(gasPrice);
        ffiCmd[4] = vm.toString(gasLimit);
        ffiCmd[5] = vm.toString(bytecode);
        ffiCmd[6] = vm.toString(keypair.addr);
        ffiCmd[7] = vm.toString(keypair.secretKey);
        ffiCmd[8] = vm.toString(keypair.publicKey);
        ffiCmd[9] = rpcUrl;

        // Execute deployment via JS script
        bytes memory result = vm.ffi(ffiCmd);
        console2.log("Deployment result: %s", string(result));
    }

    function getNonce(
        address account,
        string memory rpcUrl
    ) internal returns (uint256) {
        string[] memory rpcCmd = new string[](5);
        rpcCmd[0] = "cast";
        rpcCmd[1] = "nonce";
        rpcCmd[2] = vm.toString(account);
        rpcCmd[3] = "--rpc-url";
        rpcCmd[4] = rpcUrl;
        bytes memory result = vm.ffi(rpcCmd);
        return vm.parseUint(vm.toString(result));
    }

    function getGasPrice(string memory rpcUrl) internal returns (uint256) {
        string[] memory rpcCmd = new string[](4);
        rpcCmd[0] = "cast";
        rpcCmd[1] = "gas-price";
        rpcCmd[2] = "--rpc-url";
        rpcCmd[3] = rpcUrl;
        bytes memory result = vm.ffi(rpcCmd);
        return vm.parseUint(vm.toString(result));
    }
}
