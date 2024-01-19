Thu Jan 18 2024 12:01 PM

➜ valhalla git:(main) ✗ solana config get
Config File: /Users/mmelvin0x/.config/solana/cli/config.yml
RPC URL: https://api.devnet.solana.com
WebSocket URL: wss://api.devnet.solana.com/ (computed)
Keypair Path: /Users/mmelvin0x/.config/solana/id.json
Commitment: confirmed
➜ valhalla git:(main) ✗ solana address
5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb
➜ valhalla git:(main) ✗ solana balance
63.09250712 SOL
➜ valhalla git:(main) ✗ anchor deploy --provider.cluster devnet
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: ./.keys/id.json
Deploying program "valhalla"...
Program path: /Users/mmelvin0x/Projects/valhalla/target/deploy/valhalla.so...
Program Id: Faccsj4TmRdXeNsmP9X1MA4kqRjsD2MYL67Zc7NYgMoU

Deploy success
➜ valhalla git:(main) ✗ yarn init-locker:devnet
yarn run v1.22.21
$ anchor run init-locker --provider.cluster devnet
$ /Users/mmelvin0x/Projects/valhalla/node_modules/.bin/ts-node ./scripts/init.ts
👨‍💻 Deployer: 5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb
🔐 Locker: EcCGX2auTTaHNbYVYgCia6TK72SmyH5Rdgzt5kGVdG46
✅ Initialization Transaction: 4T8n4D3DQcYvjVoMRE9TcRrG1zczLw3YBJR3nVmCk2NNbjcEWhZUgjs4dnugcRvbQ8FgNeoonRCAQmFRFNKqbge
🐸 Admin: 5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb
💰 Treasury: 5q3JmFVTcvn2GHo5zurZbTs1p8c2zsivFLeZAHz78ppb
❤️‍🩹 Fee: 0.025
