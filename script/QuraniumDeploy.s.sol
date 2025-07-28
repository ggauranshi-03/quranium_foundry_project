// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script} from "forge-std/Script.sol";
import {HelloWorld} from "../src/HelloWorld.sol";
import {console2} from "forge-std/console2.sol";

contract QuraniumDeployer is Script {
    string public constant RPC_ALIAS = "quranium";

    function run() external {
        string memory rpcUrl = vm.rpcUrl(RPC_ALIAS);
        string memory mnemonic = vm.envString("MNEMONIC");
        string memory initialMessage = "Hello Quranium!";

        bytes memory bytecode = abi.encodePacked(
            type(HelloWorld).creationCode,
            abi.encode(initialMessage)
        );

        string[] memory ffiCmd = new string[](6);
        ffiCmd[0] = "node";
        ffiCmd[1] = "script/deploy.mjs";
        ffiCmd[2] = bytesToHexString(bytecode);
        ffiCmd[3] = mnemonic;
        ffiCmd[4] = rpcUrl;
        ffiCmd[5] = vm.toString(uint256(4062024));

        bytes memory result = vm.ffi(ffiCmd);
        console2.log("Deployment result: %s", string(result));
    }

    function bytesToHexString(
        bytes memory data
    ) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint8(data[i] >> 4)];
            str[2 + i * 2 + 1] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }
}
