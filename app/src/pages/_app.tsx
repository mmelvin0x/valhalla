import "react-datetime/css/react-datetime.css";

import { Aclonica } from "next/font/google";
import { AppProps } from "next/app";
import { ContextProvider } from "../contexts/ContextProvider";
import { FC } from "react";
import { Footer } from "../components/ui/Footer";
import Head from "next/head";
import Image from "next/image";
import Notifications from "../components/ui/notifications/Notification";
import { QueryProvider } from "contexts/QueryProvider";
import SideDrawer from "components/ui/SideDrawer";

const aclonica = Aclonica({
  subsets: ["latin"],
  weight: "400",
});

require("../styles/globals.css");
require("@solana/wallet-adapter-react-ui/styles.css");

const App: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <QueryProvider>
      <Head>
        <title>Valhalla | Token Vesting Solutions</title>
        <meta
          name="description"
          content="Token Vesting and Locks on Solana. Lock your tokens until Valhalla."
        />
      </Head>

      <style jsx global>
        {`
          h1,
          h2,
          h3,
          h4,
          h5,
          h6 {
            font-family: ${aclonica.style.fontFamily}, sans-serif;
          }
        `}
      </style>

      <ContextProvider>
        <div id="container" className="min-h-screen">
          <div className="drawer xl:drawer-open">
            <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content">
              <div className="m-8 mt-0 min-h-screen">
                <div className="navbar flex">
                  <div className="navbar-start">
                    <label
                      htmlFor="my-drawer-2"
                      className="flex items-center gap-1 cursor-pointer drawer-button xl:hidden"
                    >
                      <Image
                        src="/logo64.png"
                        alt="logo"
                        width={36}
                        height={36}
                      />{" "}
                      <h3>Valhalla</h3>
                    </label>
                  </div>
                </div>

                <Notifications />
                <Component {...pageProps} />
              </div>
            </div>

            <div className="drawer-side">
              <label
                htmlFor="my-drawer-2"
                aria-label="close sidebar"
                className="drawer-overlay"
              ></label>

              <SideDrawer />
            </div>
          </div>
          <Footer />
        </div>
      </ContextProvider>
    </QueryProvider>
  );
};

export default App;
