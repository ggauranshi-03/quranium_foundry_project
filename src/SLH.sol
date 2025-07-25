// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library SLH {
    struct KeyPair {
        address addr;
        bytes secretKey;
        bytes publicKey;
    }

    function deriveAddress(
        bytes memory publicKey
    ) internal pure returns (address) {
        bytes32 hash = keccak256(publicKey);
        return address(uint160(uint256(hash)));
    }
}
