Sat Jan 27 2024 01:00 AM

```bash
 ~/Projects/valhalla/ [main*] yarn deploy:devnet:init:data
yarn run v1.22.21
$ anchor deploy --provider.cluster devnet && yarn init-locker:devnet && yarn solita && yarn copy:idl && yarn copy:types && anchor run create-devnet-data --provider.cluster devnet
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: ./.keys/id.json
Deploying program "valhalla"...
Program path: /Users/mmelvin0x/Projects/valhalla/target/deploy/valhalla.so...
Program Id: AX3N5z4zvC1E3bYwjh16QniLDuyRVEM3ZFKxfWsrSJ7p

Deploy success
$ anchor run init-locker --provider.cluster devnet
$ /Users/mmelvin0x/Projects/valhalla/node_modules/.bin/ts-node ./scripts/init.ts
👨‍💻 Deployer: 5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb
🔐 Config: EiWk492dAfp3jFBUMa47cPJZZ3x2aEvnrzBr3WWyEUV4
✅ Initialization Transaction: 3Qari9RmRu8wfqX9HB8WQ46VDY3Di9EUi2dTeNGdAsGB4TH1B7t8w6RZvk2xDNuayjx1YXWo9Sc92ztpnxsj8t3n
🐸 Admin: 5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb
💰 Treasury: 5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb
❤️‍🩹 Fee: 0.25
```
