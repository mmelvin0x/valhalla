import "react-toastify/dist/ReactToastify.css";

import { Aclonica } from "next/font/google";
import { AppProps } from "next/app";
import { ContextProvider } from "../contexts/ContextProvider";
import { FC } from "react";
import { Footer } from "../components/Footer";
import Head from "next/head";
import Image from "next/image";
import { QueryProvider } from "../contexts/QueryProvider";
import SideDrawer from "../components/SideDrawer";
import { ToastContainer } from "react-toastify";
import logo64 from "../assets/logo64.png";
import { useRouter } from "next/router";

const aclonica = Aclonica({
  subsets: ["latin"],
  weight: "400",
});

require("../styles/globals.css");
require("@solana/wallet-adapter-react-ui/styles.css");

const App: FC<AppProps> = ({ Component, pageProps }) => {
  const router = useRouter();

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
              <div
                className={`min-h-screen ${
                  router.pathname === "/" ? "" : "max-w-screen-xl mx-auto"
                }`}
              >
                <div className="navbar z-10">
                  <div className="navbar-start">
                    <label
                      htmlFor="my-drawer-2"
                      className="btn flex items-center gap-1 cursor-pointer drawer-button xl:hidden"
                    >
                      <Image
                        placeholder="blur"
                        src={logo64}
                        alt="logo"
                        width={36}
                        height={36}
                      />{" "}
                      <h3>Valhalla</h3>
                    </label>
                  </div>
                </div>

                <Component {...pageProps} />
              </div>

              <ToastContainer
                position="top-right"
                autoClose={5000}
                rtl={false}
                pauseOnHover
              />

              <Footer />
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
        </div>
      </ContextProvider>
    </QueryProvider>
  );
};

export default App;
