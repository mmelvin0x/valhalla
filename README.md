Sat Jan 21 2024 06:22 PM

```bash
 ~/Projects/valhalla/ [main*] yarn deploy:devnet:init
yarn run v1.22.21
$ anchor deploy --provider.cluster devnet && yarn init-locker:devnet && yarn solita && yarn copy:idl && yarn copy:types
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: ./.keys/id.json
Deploying program "valhalla"...
Program path: /Users/mmelvin0x/Projects/valhalla/target/deploy/valhalla.so...
Program Id: kY1w5a15ADvW28ZKnoSmbK53LnrBdwiUX5gg4fHq6nc

Deploy success
$ anchor run init-locker --provider.cluster devnet
$ /Users/mmelvin0x/Projects/valhalla/node_modules/.bin/ts-node ./scripts/init.ts
👨‍💻 Deployer: 5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb
🔐 Config: 6idxboizHvjrYjpmh2rgM4tLeUcCoYmwqQfFdscb8bso
✅ Initialization Transaction: 352CwNgsjirED4Dj6QVRHGsKA6gZHHbABmBRPtZsKAfVzto169vFaH6GwDFxZ7aAQNZ1QzA42Ap3zmdwV34KezyJ
🐸 Admin: 5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb
💰 Treasury: 5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb
❤️‍🩹 Fee: 0.025
$ /Users/mmelvin0x/Projects/valhalla/node_modules/.bin/solita
    Finished release [optimized] target(s) in 0.11s
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
✨  Done in 26.45s.
```
