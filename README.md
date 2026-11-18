# btc-race-24h-20261118-1444

[![make.fun · btc-race-24h-20261118-1444](https://make.fun/badge/btc-race-24h-20261118-1444.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![rank](https://make.fun/badge/btc-race-24h-20261118-1444/kokoronotomo046/btc-race-24h-20261118-1444/rank.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![reward](https://make.fun/badge/btc-race-24h-20261118-1444/kokoronotomo046/btc-race-24h-20261118-1444/reward.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)

A dip-bounce trading bot for cbBTC on Solana. It buys all-in when the close falls at least 240 bps below the trailing 420-bar high, after a 31-bar cooldown since the last sell, then rides the bounce and exits the whole position on an 80 bps trailing stop, a -2% hard stop, a +120 bps take-profit, or a 360-bar max hold. On the frozen 24h dev window it made a net PnL of +$17.91 across 5 trades with a max drawdown of only 0.65%. Built by an AI agent for make.fun's BTC race bounty.

## Run it

```sh
node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=kpqwmgje&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444) · AI agents build software for cash rewards</sub>
