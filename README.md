# valhalla

This project is generated with the [create-solana-dapp](https://github.com/solana-developers/create-solana-dapp) generator.

## Getting Started

### Prerequisites

- Node v18.18.0 or higher

- Rust v1.70.0 or higher
- Anchor CLI 0.29.0 or higher
- Solana CLI 1.17.0 or higher

### Installation

#### Clone the repo

```shell
git clone <repo-url>
cd <repo-name>
```

#### Install Dependencies

```shell
npm install
```

#### Start the web app

```
npm run dev
```

## Apps

### anchor

This is a Solana program written in Rust using the Anchor framework.

#### Commands

You can use any normal anchor commands. Either move to the `anchor` directory and run the `anchor` command or prefix the command with `npm run`, eg: `npm run anchor`.

#### Sync the program id:

Running this command will create a new keypair in the `anchor/target/deploy` directory and save the address to the Anchor config file and update the `declare_id!` macro in the `./src/lib.rs` file of the program.

You will manually need to update the constant in `anchor/lib/basic-exports.ts` to match the new program id.

```shell
npm run anchor keys sync
```

#### Build the program:

```shell
npm run anchor-build
```

#### Start the test validator with the program deployed:

```shell
npm run anchor-localnet
```

#### Run the tests

```shell
npm run anchor-test
```

#### Deploy to Devnet

```shell
npm run anchor deploy --provider.cluster devnet
```

### web

This is a React app that uses the Anchor generated client to interact with the Solana program.

#### Commands

Start the web app

```shell
npm run dev
```

Build the web app

```shell
npm run build
```

# Deployments

## Mainnet Deployment

N/A

## Devnet Deployment

 ~/Workspace/valhalla/ [main] yarn anchor deploy -- --provider.cluster devnet
yarn run v1.22.21
warning From Yarn 1.0 onwards, scripts don't require "--" for options to be forwarded. In a future version, any explicit "--" will be forwarded as-is to the scripts.
$ nx run anchor:anchor deploy --provider.cluster devnet

> nx run anchor:anchor deploy --provider.cluster devnet

Deploying cluster: https://api.devnet.solana.com
Upgrade authority: ./.keys/id.json
Deploying program "valhalla"...
Program path: /Users/mmelvin0x/Workspace/valhalla/anchor/target/deploy/valhalla.so...
Program Id: Ct63b5aLvhYT2bSvK3UG3oTJF8PgAC3MzDwpqXRKezF6

Deploy success

——————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

NX Successfully ran target anchor for project anchor (58s)

      With additional flags:
        deploy
        --provider={"cluster":"devnet"}

✨ Done in 58.13s.
 ~/Workspace/valhalla/ [main*] yarn anchor run init --provider.cluster devnet
yarn run v1.22.21
$ nx run anchor:anchor run init --provider.cluster devnet

> nx run anchor:anchor run init --provider.cluster devnet

warning package.json: No license field
$ /Users/mmelvin0x/Workspace/valhalla/anchor/node_modules/.bin/ts-node ./scripts/init.ts
👨‍💻 Deployer: AUcxPLH8dQ7gDFTt6N4Cp57JQtqBnd3H9yrdyGKZpAtA
🔐 Config: 38wmZoG3WGwkjmHr39UnYYPfB8CyHFLnUWuLDYDSE2ku
✅ Initialization Transaction: 2vuUUctEBFtxjM4bo5PqRJUUrYpayHjmp2MCwubm7UQ62E38X26UUkwEmr3U5A2ePHXhwyc9j9pHuoyCp4HSK4zS
🐸 Admin: AUcxPLH8dQ7gDFTt6N4Cp57JQtqBnd3H9yrdyGKZpAtA
💰 SOL Treasury: AUcxPLH8dQ7gDFTt6N4Cp57JQtqBnd3H9yrdyGKZpAtA
💰 Token Treasury:: AUcxPLH8dQ7gDFTt6N4Cp57JQtqBnd3H9yrdyGKZpAtA
🫡 Reward Mint: Gb8Gx4TbGKnwaAkg3oF2crDdrHvx11CizPmkskoPy4YV
❤️‍🩹 SOL Fee: 0.05
❤️‍🩹 Token Fee BPS: 50
🪙 Reward Token Amount: 1000000000

——————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

NX Successfully ran target anchor for project anchor (10s)

      With additional flags:
        run init
        --provider={"cluster":"devnet"}

✨ Done in 10.95s.
 ~/Workspace/valhalla/ [main*] yarn anchor run create-data --provider.cluster devnet
yarn run v1.22.21
$ nx run anchor:anchor run create-data --provider.cluster devnet

> nx run anchor:anchor run create-data --provider.cluster devnet

warning package.json: No license field
$ /Users/mmelvin0x/Workspace/valhalla/anchor/node_modules/.bin/ts-node ./scripts/create-data.ts
User one: J7eKcBfEkVpt5iGGTGL7oXX9RcSBR7vGihkSisjpbyoB
User two: GQg22KPsLhEysUHsKdz4RxEW5oWTFQa4A7oQgvsSP6x6
Creating SPL vaults...
Creating Token 2022 vaults...
Created SPL vault 1/5
Created Token 2022 vault 1/5
Created SPL vault 2/5
Created Token 2022 vault 2/5
Created SPL vault 3/5
Created Token 2022 vault 3/5
Created SPL vault 4/5
Created Token 2022 vault 4/5
Created SPL vault 5/5
Created Token 2022 vault 5/5

——————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

NX Successfully ran target anchor for project anchor (1m)

      With additional flags:
        run create-data
        --provider={"cluster":"devnet"}

✨ Done in 84.37s.
 ~/Workspace/valhalla/ [main*]
