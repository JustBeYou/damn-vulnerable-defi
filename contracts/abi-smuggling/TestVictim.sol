// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract TestVictim {
    uint32 x;

    constructor() {}

    function f(uint32 y) external {
        x = y;
        console.log("hello i am a victim", y);
    }
}
