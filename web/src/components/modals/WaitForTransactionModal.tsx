import { IconCircleX } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { getExplorerUrl } from "@/src/utils/explorer";
import logo from "@/src/assets/logo256.png";
import useProgram from "@/src/utils/useProgram";
import { useRouter } from "next/router";

export default function WaitForTransactionModal({
  tx,
  route,
}: {
  tx?: string;
  route?: string;
}) {
  const { connection } = useProgram();
  const router = useRouter();

  const onModalClose = () => {
    if (route) {
      router.push(route);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <dialog id="tx_modal" className="modal modal-bottom sm:modal-middle">
      <div className="modal-box min-h-96 relative">
        <h4 className="">
          {tx ? "Transaction Complete!" : "Transaction Pending"}
        </h4>

        <form method="dialog" className="absolute top-0 right-0 m-1">
          {/* if there is a button in form, it will close the modal */}
          <button className="btn btn-circle btn-sm" onClick={onModalClose}>
            <IconCircleX className="w-6 h-6" />
          </button>
        </form>

        <div className="flex flex-col items-center gap-4">
          <Image src={logo} width={256} height={256} alt="Valhalla Logo" />

          {!tx && (
            <p className="animate-bounce">
              Your transaction is being processed...
            </p>
          )}

          {!!tx && (
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center gap-1 self-center">
                <span>View your transaction</span>{" "}
                <Link
                  className="link link-primary"
                  href={getExplorerUrl(connection.rpcEndpoint, tx, "tx")}
                >
                  here.
                </Link>
              </div>

              <div className="flex items-center gap-2 self-end">
                <button
                  onClick={onModalClose}
                  className="btn btn-sm btn-primary self-end"
                >
                  Done
                </button>

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
