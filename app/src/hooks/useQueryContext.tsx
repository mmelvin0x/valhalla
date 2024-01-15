import { useRouter } from "next/router";

export type EndpointTypes = "mainnet" | "devnet" | "localnet";

export default function useQueryContext() {
  const router = useRouter();
  const { cluster } = router.query;

  const endpoint = cluster ? (cluster as EndpointTypes) : "mainnet";
  const hasClusterOption = endpoint !== "mainnet";
  const fmtUrlWithCluster = (url: string) => {
    if (hasClusterOption) {
      const mark = url.includes("?") ? "&" : "?";
      return decodeURIComponent(`${url}${mark}cluster=${endpoint}`);
    }
    return url;
  };

  return {
    fmtUrlWithCluster,
  };
}
