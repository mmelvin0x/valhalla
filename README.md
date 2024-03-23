```bash
 ~/Workspace/valhalla/ [refactor*] yarn deploy:init:devnet
yarn run v1.22.21
$ anchor deploy --provider.cluster devnet && yarn init:devnet && yarn solita && yarn copy
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: ./.keys/id.json
Deploying program "valhalla"...
Program path: /valhalla/target/deploy/valhalla.so...
Program Id: 8eqnKMrBM7kk73d7U4UDVzn9SFX9o8nE1woX6x6nAkgP

Deploy success
$ anchor run init --provider.cluster devnet
$ /valhalla/node_modules/.bin/ts-node ./scripts/init.ts
👨‍💻 Deployer: AUcxPLH8dQ7gDFTt6N4Cp57JQtqBnd3H9yrdyGKZpAtA
🔐 Config: 2f1VmTtJwEqy9n9q2Qwzay3KBH8NeQwsZrWLQAwCd1cc
✅ Initialization Transaction: 2BNReMpuMJJ3kMXkBUkgQzCrhDVPmU8hN5FiyPJoB4LQNnD5uGdpbZ8B1PPNMBLyyc16cgP1Awb5wZzvSM4HbbVt
🐸 Admin: AUcxPLH8dQ7gDFTt6N4Cp57JQtqBnd3H9yrdyGKZpAtA
💰 SOL Treasury: AUcxPLH8dQ7gDFTt6N4Cp57JQtqBnd3H9yrdyGKZpAtA
💰 Token Treasury:: AUcxPLH8dQ7gDFTt6N4Cp57JQtqBnd3H9yrdyGKZpAtA
🫡 Reward Mint: 4mE9Gmeemgs4YmZ1RkCZKWi7YWThRs2shoaXuca15pZP
❤️‍🩹 SOL Fee: 0.05
❤️‍🩹 Token Fee BPS: 50
🪙 Reward Token Amount: 10000000
$ /valhalla/node_modules/.bin/solita
    Finished release [optimized] target(s) in 0.12s
warning: the following packages contain code that will be rejected by a future version of Rust: libc v0.2.151
note: to see what the problems were, use the option `--future-incompat-report`, or run `cargo report future-incompatibilities --id 4`
IDL written to: /valhalla/target/idl/valhalla.json
Generating TypeScript SDK to /valhalla/app/src/program
Writing instructions to directory: app/src/program/instructions
Writing accounts to directory: app/src/program/accounts
Writing types to directory: app/src/program/types
Writing errors to directory: app/src/program/errors
Success!
$ cp ./target/idl/valhalla.json ./app/src/program/idl.json && cp ./target/types/valhalla.ts ./app/src/program/valhalla.ts && cp ./target/idl/valhalla.json ./server/src/program/idl.json && cp ./target/types/valhalla.ts ./server/src/program/valhalla.ts
✨  Done in 40.59s.
 ~/Workspace/valhalla/ [refactor*] yarn solita
yarn run v1.22.21
$ /valhalla/node_modules/.bin/solita
    Finished release [optimized] target(s) in 0.11s
warning: the following packages contain code that will be rejected by a future version of Rust: libc v0.2.151
note: to see what the problems were, use the option `--future-incompat-report`, or run `cargo report future-incompatibilities --id 5`
IDL written to: /valhalla/target/idl/valhalla.json
Generating TypeScript SDK to /valhalla/server/src/program
Writing instructions to directory: server/src/program/instructions
Writing accounts to directory: server/src/program/accounts
Writing types to directory: server/src/program/types
Writing errors to directory: server/src/program/errors
Success!
✨  Done in 0.70s.
```
