// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script} from "forge-std/Script.sol";
import {HelloWorld} from "../src/HelloWorld.sol";
import {console2} from "forge-std/console2.sol";

contract QuraniumDeployer is Script {
    // Define RPC URL alias as constant
    string public constant RPC_ALIAS = "quranium";

    function run() external {
        string memory rpcUrl = vm.rpcUrl(RPC_ALIAS);
        string memory mnemonic = vm.envString("MNEMONIC"); // Get from environment
        string memory initialMessage = "Hello Quranium!";

        // Prepare deployment transaction
        bytes memory bytecode = abi.encodePacked(
            type(HelloWorld).creationCode,
            abi.encode(initialMessage)
        );

        // Build FFI command to call JS deployment script
        string[] memory ffiCmd = new string[](6);
        ffiCmd[0] = "node";
        ffiCmd[1] = "script/deploy.mjs";
        ffiCmd[2] = vm.toString(bytecode); // Use generic toString for bytes
        ffiCmd[3] = mnemonic; // Already a string
        ffiCmd[4] = rpcUrl; // Already a string
        ffiCmd[5] = vm.toString(uint256(4062024)); // Use toString for uint

        // Execute deployment via JS script
        bytes memory result = vm.ffi(ffiCmd);
        console2.log("Deployment result: %s", string(result));
    }
}
