import {
  Vault,
  getCronStringFromVault,
  hasStartDatePassed,
  sleep,
  vaultDiscriminator,
} from "@valhalla/lib";

import { close } from "./close";
import { connection } from "./network";
import cron from "node-cron";
import { disburse } from "./disburse";

export const checkVaults = async (
  scheduledVaults: Map<string, boolean>
): Promise<Map<string, boolean>> => {
  const gpaBuilder = Vault.gpaBuilder();
  gpaBuilder.addFilter("autopay", true);
  gpaBuilder.addFilter("accountDiscriminator", vaultDiscriminator);
  const response = await gpaBuilder.run(connection);

  console.log("Checking for vaults...");
  const vaults = response
    .map((account) => Vault.fromAccountInfo(account.account)[0])
    .map((vault) => {
      scheduledVaults.set(vault.identifier.toString(), false);
      return vault;
    });

  for (let i = 0; i < vaults.length; i++) {
    if (scheduledVaults.get(vaults[i].identifier.toString())) {
      console.log(
        `Vault ${vaults[i].identifier} is already scheduled. Skipping...`
      );

      continue;
    }

    if (!hasStartDatePassed(Number(vaults[i].startDate))) {
      console.log(
        `Vault ${vaults[i].identifier} has not started yet. Skipping...`
      );

      continue;
    }

    const interval = getCronStringFromVault(Number(vaults[i].payoutInterval));

    if (cron.validate(interval)) {
      try {
        console.log(
          `Scheduling vault ${vaults[i].identifier} w/ interval ${interval}...`
        );

        cron
          .schedule(
            interval,
            async () => {
              try {
                await disburse(vaults[i]);
              } catch (e) {
                if (e.message.includes("0x1770")) {
                  console.error(
                    `Vault ${vaults[i].identifier.toString()} is locked.`
                  );
                } else if (e.message.includes("0x1772")) {
                  await close(vaults[i]);

                  cron.getTasks().forEach((task) => {
                    console.log(task);
                  });
                } else {
                  console.error(e);
                }
              }
            },
            {
              recoverMissedExecutions: true,
              runOnInit: true,
              name: vaults[i].identifier.toString(),
            }
          )
          .start();

        scheduledVaults.set(vaults[i].identifier.toString(), true);
      } catch (e) {
        if (e.logs?.[3].includes("already in use")) {
          scheduledVaults.set(vaults[i].identifier.toString(), true);
        } else {
          console.error(e);
        }
      }
    } else {
      console.error(
        `Invalid cron string for vault ${vaults[
          i
        ].identifier.toString()}: ${getCronStringFromVault(
          Number(vaults[i].payoutInterval)
        )}`
      );
    }

    await sleep(5000);
  }

  return scheduledVaults;
};
