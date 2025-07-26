// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Counter.sol";

contract DeployContract is Script {
    function run() external {
        // Read PRIVATE_KEY as a hex string and cast to uint256
        uint256 deployerPrivateKey = uint256(vm.envBytes32("PRIVATE_KEY"));

        vm.startBroadcast(deployerPrivateKey);
        Counter counter = new Counter();
        console.log("Counter deployed at:", address(counter));
        vm.stopBroadcast();
    }
}
