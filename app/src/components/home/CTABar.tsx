import Link from "next/link";

export default function CTABar() {
  return (
    <div className="header -mt-2 py-4">
      <div className="container mx-auto flex justify-between items-center">
        <h4 className="text-2xl font-bold">
          Gain Your Communities Trust with Valhalla
        </h4>
        <Link href="/locks/create" className="btn btn-accent">
          Lock your LP Tokens
        </Link>
      </div>
    </div>
  );
}
