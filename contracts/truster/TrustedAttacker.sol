// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../DamnValuableToken.sol";


contract TrustedAttacker {
    address owner;

    constructor(address _owner) {
        owner = _owner;
    }

    receive() external payable {

    }
}