// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "hardhat/console.sol";
import "./TestVictim.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract AttackerAbi {
    using Address for address;

    constructor(address victim) {
        console.log("victim", victim);

        bytes4 selector = bytes4(keccak256(abi.encodePacked("f(uint32)")));
        assert(selector == TestVictim.f.selector);
        console.log("victim f selector", uint32(TestVictim.f.selector));
        console.log("target selector", uint32(selector));
        victim.functionCall(abi.encodeWithSelector(selector, 1));
        victim.functionCall(abi.encodeWithSelector(selector, 1, 0xdeadbeef));

        console.logBytes(abi.encodeWithSelector(selector, 1));
        console.logBytes(abi.encodeWithSelector(selector, 1, 0xdeadbeef));
    }
}
