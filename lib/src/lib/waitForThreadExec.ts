import { ClockworkProvider } from "@clockwork-xyz/sdk";
import { PublicKey } from "@solana/web3.js";

let lastThreadExec = BigInt(0);
export const waitForThreadExec = async (
  clockworkProvider: ClockworkProvider,
  thread: PublicKey,
  maxWait = 60
) => {
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const execContext = (await clockworkProvider.getThreadAccount(thread))
      .execContext;

    if (execContext) {
      if (
        lastThreadExec.toString() == "0" ||
        execContext.lastExecAt > lastThreadExec
      ) {
        lastThreadExec = execContext.lastExecAt;
        break;
      }
    }

    if (i == maxWait) throw Error("Timeout");
    i += 1;

    await new Promise((r) => setTimeout(r, i * 1000));
  }
};
