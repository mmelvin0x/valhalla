```bash
yarn run v1.22.21
$ anchor deploy --provider.cluster devnet && yarn init-config:devnet && yarn solita && yarn copy:idl && yarn copy:types
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: ./.keys/id.json
Deploying program "valhalla"...
Program path: /Users/mmelvin0x/Workspace/MichaelMelvin_Sol_1Q24/capstone/valhalla/target/deploy/valhalla.so...
Program Id: 4m91tz91kUVLg2Yv9MypJWysyg34RCmJziCaAoKQuuky

Deploy success
$ anchor run init-config --provider.cluster devnet
$ /Users/mmelvin0x/Workspace/MichaelMelvin_Sol_1Q24/capstone/valhalla/node_modules/.bin/ts-node ./scripts/init.ts
👨‍💻 Deployer: AUcxPLH8dQ7gDFTt6N4Cp57JQtqBnd3H9yrdyGKZpAtA
🔐 Config: ASXLJz4DCLAPRZesj7KTki95S4aVD12gA2FjSwecNGDf
✅ Initialization Transaction: 5yt39qxa4vjiSNtY9Rbu8JV6sZLe7g1Tffj5ZrRDWLT7roWEyZGmE35NZ7Lq96cdf8JERrw9jYLo8jyod1nzuANt
🐸 Admin: AUcxPLH8dQ7gDFTt6N4Cp57JQtqBnd3H9yrdyGKZpAtA
💰 SOL Treasury: AUcxPLH8dQ7gDFTt6N4Cp57JQtqBnd3H9yrdyGKZpAtA
💰 Token Treasury:: AUcxPLH8dQ7gDFTt6N4Cp57JQtqBnd3H9yrdyGKZpAtA
🫡 Reward Mint: Dwv3dsS9kdJPVpoUUPLYEuJPVfnwSdvu3PPgfoJexdYa
❤️‍🩹 SOL Fee: 0.025
❤️‍🩹 Token Fee BPS: 10
🪙 Reward Token Amount: 10000000000
$ /Users/mmelvin0x/Workspace/MichaelMelvin_Sol_1Q24/capstone/valhalla/node_modules/.bin/solita
    Finished release [optimized] target(s) in 0.11s
warning: the following packages contain code that will be rejected by a future version of Rust: libc v0.2.151
note: to see what the problems were, use the option `--future-incompat-report`, or run `cargo report future-incompatibilities --id 3`
IDL written to: /Users/mmelvin0x/Workspace/MichaelMelvin_Sol_1Q24/capstone/valhalla/target/idl/valhalla.json
Generating TypeScript SDK to /Users/mmelvin0x/Workspace/MichaelMelvin_Sol_1Q24/capstone/valhalla/app/src/program
Writing instructions to directory: app/src/program/instructions
Writing accounts to directory: app/src/program/accounts
Writing types to directory: app/src/program/types
Writing errors to directory: app/src/program/errors
Success!
$ cp ./target/idl/valhalla.json ./app/src/program/idl.json
$ cp ./target/types/valhalla.ts ./app/src/program/valhalla.ts
✨  Done in 26.06s.
```
