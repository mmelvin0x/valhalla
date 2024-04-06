import "react-toastify/dist/ReactToastify.css";

import { Aclonica, Poppins } from "next/font/google";

import { AppProps } from "next/app";
import { ContextProvider } from "../contexts/ContextProvider";
import { DefaultSeo } from "next-seo";
import { FC } from "react";
import { Footer } from "../components/Footer";
import { IconMenu2 } from "@tabler/icons-react";
import { QueryProvider } from "../contexts/QueryProvider";
import SideDrawer from "../components/SideDrawer";
import { ToastContainer } from "react-toastify";
import { useRouter } from "next/router";

const aclonica = Aclonica({
  subsets: ["latin"],
  weight: "400",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700"],
});

require("../styles/globals.css");
require("@solana/wallet-adapter-react-ui/styles.css");

const App: FC<AppProps> = ({ Component, pageProps }) => {
  const router = useRouter();

  return (
    <QueryProvider>
      <DefaultSeo
        defaultTitle="Valhalla"
        description="Token 2022 & SPL compatible token vesting on Solana. We incentivize token vesting by rewarding users with $ODIN when they disburse a vault. The $ODIN token serves as the governance token for Valhalla DAO. Get $ODIN - control Valhalla."
        titleTemplate="%s | Valhalla"
        themeColor="#10172a"
        openGraph={{
          type: "website",
          locale: "en_US",
          url: "https://valhalla.so",
          title: "Valhalla | Incentivized Vesting",
          description:
            "Token 2022 & SPL compatible token vesting on Solana. We incentivize token vesting by rewarding users with $ODIN when they disburse a vault. The $ODIN token serves as the governance token for Valhalla DAO. Get $ODIN - control Valhalla.",
          siteName: "Valhalla",
          images: [
            {
              url: "https://github.com/mmelvin0x/valhalla/blob/main/web/public/assets/twittercard.png?raw=true",
              width: 1120,
              height: 630,
              alt: "OG Image",
              type: "image/jpeg",
            },
          ],
        }}
        twitter={{
          handle: "@Valhalla_so",
          site: "@Valhalla_so",
          cardType: "summary_large_image",
        }}
      />

      <style jsx global>
        {`
          body {
            font-family: ${poppins.style.fontFamily}, sans-serif;
          }

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
                <div className="navbar z-10 absolute w-40">
                  <div className="navbar-start">
                    <label
                      htmlFor="my-drawer-2"
                      className="btn flex items-center gap-1 cursor-pointer drawer-button xl:hidden"
                    >
                      <IconMenu2 className="text-primary" />
                    </label>
                  </div>
                </div>

                <Component {...pageProps} />
              </div>

              <ToastContainer
                position="bottom-left"
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
