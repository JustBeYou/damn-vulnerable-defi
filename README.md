![](cover.png)

**A set of challenges to learn offensive security of smart contracts in Ethereum.**

Featuring flash loans, price oracles, governance, NFTs, lending pools, smart contract wallets, timelocks, and more!

## Play

Visit [damnvulnerabledefi.xyz](https://damnvulnerabledefi.xyz)

## Progress

1. [X] Unstoppable - **00h:45m** - transfer funds from attacker DVT balance
directly to the DVT balance of the vault
2. [X] Naive receiver - **00h:25m** - unchecked callback caller in loan receiver
3. [X] Truster - **00h:15m** - impersonate the pool to call ERC20 approve on itself for attacker
4. [X] Side Entrance - **00h:40m** - use pool's funds to deposit in attacker's account, spent quite a
little bit of time reading about call/transfer/send, even if not really necessary
5. [X] The Rewarder - **00h:35m** - dillution using lended funds
6. [X] Selfie - **01h:00m** - take advantage of the public snapshop function, lost a lot of time
because I was sending all the Wei in the executed action call so no gas remained for running
the code
7. [X] Compromised - **00h:35m** - leaked private key, hardhat in JS is a pain to use, no typing :(
8. [X] Puppet - **01h:30m** - lost a lot of fucking time because `Transaction reverted: function selector was not recognized and there's no fallback nor receive function`. still can't compile
a contract that interacts with the damn uniswap. took only five minutes after deciding to solve it in
JS directly. exploit the lack of liquidity.
9. [X] Puppet V2 - **01h:10m** - price manipulation using borrowed money, still getting used to the APIs
10. [X] Free Rider - **02h:30m** - use UniSwap loans to buy NFTs then exploit a bug in how the market
checks if you have enough funds to buy all the NFTs using only the funds necessary to buy one;
finllly, buy the tokens from yourself multiple times to exploit the bug again and drain the
funds of the market; finally get the price; NICE
11. [X] Backdoor - **04h:45m** - WIP lots of time reading about solidity debugging, it's simply an awful experience; we can add a trusted module to the wallet at its creation and use that to drain the funds; debugging delegatecall seems impossible; 
12. [X] Climber - **01h:50m** - ClimberTimeLock execute calls before checking the if they are allowed
to be executed, this can result in the manipulation of the state of the contract itself
13. [X] Wallet Mining - **04h:00m** - we can control the target address of the newly deployed contract
and we can target it at the DEPOSIT_ADDRESS + replay attacks for the gnosis contracts; selfdestruct trick to extract funds;
pretty hard to inspect the blockchain using ethers/hardhat, not the best docs;
14. [ ] Puppet V3 - **03h:00m** - WIP read about automatic market making, providing liquidity, impermanent loss, concentrated
liquidity and other interesting stuff; read the paper on uniswap v1 and v3; price manipulation AGAIN.
15. [X] ABI Smuggling - **03h:00** - mess up with the calldata layout, because execute() function loads the selector at a 
fixed offest and can be tricked to check one selector, but use another for calling