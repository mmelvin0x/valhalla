```bash
yarn run v1.22.21
$ anchor deploy --provider.cluster devnet && yarn init-config:devnet && yarn solita && yarn copy:idl && yarn copy:types
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: ./.keys/id.json
Deploying program "valhalla"...
Program path: /Users/mmelvin0x/Workspace/MichaelMelvin_Sol_1Q24/capstone/valhalla/target/deploy/valhalla.so...
Program Id: 44dSpmq2ATy23AiyouLCzsPgn12WeaTv8pi6ym5UHNGV

Deploy success
$ anchor run init-config --provider.cluster devnet
$ /Users/mmelvin0x/Workspace/MichaelMelvin_Sol_1Q24/capstone/valhalla/node_modules/.bin/ts-node ./scripts/init.ts
👨‍💻 Deployer: AUcxPLH8dQ7gDFTt6N4Cp57JQtqBnd3H9yrdyGKZpAtA
🔐 Config: BJVgJH1K5awEFfTansfzjnR27p6tZFBuusb2NNN38ff7
✅ Initialization Transaction: 434dhF95WQAfYNJRhESkir31y5ihFL4rpwA67Tv2rBbjejJJPDHsb4ys9qPBuXqrNegTbsnZMz4znSUkXtTywGcH
🐸 Admin: AUcxPLH8dQ7gDFTt6N4Cp57JQtqBnd3H9yrdyGKZpAtA
💰 SOL Treasury: AUcxPLH8dQ7gDFTt6N4Cp57JQtqBnd3H9yrdyGKZpAtA
💰 Token Treasury:: AUcxPLH8dQ7gDFTt6N4Cp57JQtqBnd3H9yrdyGKZpAtA
🫡 Reward Mint: HB5bdpgk21tSGmeMNukE58XKB6VdieBpNsg4iYw5uo6U
❤️‍🩹 SOL Fee: 0.025
❤️‍🩹 Token Fee BPS: 10
🪙 Reward Token Amount: 10000000000
$ /Users/mmelvin0x/Workspace/MichaelMelvin_Sol_1Q24/capstone/valhalla/node_modules/.bin/solita
    Finished release [optimized] target(s) in 0.12s
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
✨  Done in 27.32s.
```
