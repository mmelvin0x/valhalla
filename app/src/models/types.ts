export type EndpointTypes = "mainnet" | "devnet" | "localnet";

export enum Authority {
  Neither,
  OnlyFunder,
  OnlyBeneficiary,
  Both,
}
