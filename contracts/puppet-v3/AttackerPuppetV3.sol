// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

/*
weth.address,  // token0
token.address, // token1
zeroForOne The direction of the swap, true for token0 to token1, false for token1 to token0
*/

contract AttackerPuppetV3 {
    constructor() {}

    function step1(IUniswapV3Pool exchange) external {
        exchange.swap(address(this), false, 1000, 0, bytes("0x"));
    }

    function step2() external {}
}
