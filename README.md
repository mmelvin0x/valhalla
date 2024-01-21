Sat Jan 20 2024 10:00 PM

```bash
 ~/Projects/valhalla/ [main*] solana config get
Config File: /Users/mmelvin0x/.config/solana/cli/config.yml
RPC URL: https://api.devnet.solana.com
WebSocket URL: wss://api.devnet.solana.com/ (computed)
Keypair Path: /Users/mmelvin0x/.config/solana/id.json
Commitment: confirmed
 ~/Projects/valhalla/ [main*] solana address
5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb
 ~/Projects/valhalla/ [main*] solana balance
77.0643984 SOL
 ~/Projects/valhalla/ [main*] yarn deploy:devnet:init
yarn run v1.22.21
$ anchor deploy --provider.cluster devnet && yarn init-locker:devnet && yarn solita && yarn copy:idl && yarn copy:types
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: ./.keys/id.json
Deploying program "valhalla"...
Program path: /Users/mmelvin0x/Projects/valhalla/target/deploy/valhalla.so...
Program Id: CpeQRExCTr7a6pzjF7mGsT6HZVpAM636xSUFC4STTJFn

Deploy success
$ anchor run init-locker --provider.cluster devnet
$ /Users/mmelvin0x/Projects/valhalla/node_modules/.bin/ts-node ./scripts/init.ts
👨‍💻 Deployer: 5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb
🔐 Config: 7mncJTCBdJtEVYH1qa3JkRCHxhuBryYvX45KPPECmhKg
✅ Initialization Transaction: 4s4zbFJt2CQ5smGt8tAQS11SZYNfXfM6gj3XHb6LED6yzpEtTazcrVwXKakVRBYyEwSKUnJ8UGhZKrK8zPBxbAbM
🐸 Admin: 5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb
💰 Treasury: 5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb
❤️‍🩹 Fee: 0.025
$ /Users/mmelvin0x/Projects/valhalla/node_modules/.bin/solita
    Finished release [optimized] target(s) in 0.15s
warning: the following packages contain code that will be rejected by a future version of Rust: libc v0.2.151
note: to see what the problems were, use the option `--future-incompat-report`, or run `cargo report future-incompatibilities --id 2`
IDL written to: /Users/mmelvin0x/Projects/valhalla/target/idl/valhalla.json
Generating TypeScript SDK to /Users/mmelvin0x/Projects/valhalla/app/src/program
Writing instructions to directory: app/src/program/instructions
Writing accounts to directory: app/src/program/accounts
Writing types to directory: app/src/program/types
Writing errors to directory: app/src/program/errors
Success!
$ cp ./target/idl/valhalla.json ./app/src/program/idl.json
$ cp ./target/types/valhalla.ts ./app/src/program/valhalla.ts
✨  Done in 34.56s.
```
