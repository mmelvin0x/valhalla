import { ExplorerLink } from "../ExplorerLink";
import { IconCircleX } from "@tabler/icons-react";
import Image from "next/image";
import logo from "@/src/assets/logo256.png";
import { shortenSignature } from "@valhalla/lib";
import { useRouter } from "next/router";

export default function WaitForTransactionModal({
  txIds,
  route,
}: {
  route: string;
  txIds: string[];
}) {
  const router = useRouter();

  const onModalClose = () => {
    router.push(route);
  };

  return (
    <dialog id="tx_modal" className="modal modal-bottom sm:modal-middle">
      <div className="modal-box min-h-96 relative">
        <h4 className="">
          {txIds.length ? "Transaction Complete!" : "Transaction Pending"}
        </h4>

        <form method="dialog" className="absolute top-0 right-0 m-1">
          {/* if there is a button in form, it will close the modal */}
          <button className="btn btn-circle btn-sm">
            <IconCircleX className="w-6 h-6" />
          </button>
        </form>

        <div className="flex flex-col items-center gap-4">
          <Image src={logo} width={256} height={256} alt="Valhalla Logo" />

          {!txIds.length && (
            <p className="animate-bounce">
              Your transaction is being processed...
            </p>
          )}

          {!!txIds.length && (
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center gap-1 self-center">
                <span>View your transaction{txIds.length > 1 ? "s" : ""}</span>{" "}
                {txIds.map((tx) => {
                  return (
                    <ExplorerLink
                      key={tx}
                      label={shortenSignature(tx)}
                      type="tx"
                      address={tx}
                    />
                  );
                })}
              </div>

              <div className="flex items-center gap-2 self-end">
                <form method="dialog" className="absolute top-0 right-0 m-1">
                  {/* if there is a button in form, it will close the modal */}
                  <button className="btn btn-sm btn-error self-end">
                    <IconCircleX className="w-6 h-6" />
                  </button>
                </form>

                {route && (
                  <button
                    onClick={onModalClose}
                    className="btn btn-sm btn-accent self-end"
                  >
                    Go to Vault
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
