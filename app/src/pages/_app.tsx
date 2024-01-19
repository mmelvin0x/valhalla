import "react-datetime/css/react-datetime.css";

import { Aclonica } from "next/font/google";
import { AppBar } from "../components/ui/AppBar";
import { AppProps } from "next/app";
import { ContextProvider } from "../contexts/ContextProvider";
import { FC } from "react";
import { Footer } from "../components/ui/Footer";
import Head from "next/head";
import Notifications from "../components/notifications/Notification";

const aclonica = Aclonica({
  subsets: ["latin"],
  weight: "400",
});

require("../styles/globals.css");
require("@solana/wallet-adapter-react-ui/styles.css");

const App: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <>
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
        <Notifications />
        <AppBar />
        <div
          id="container"
          className="my-10 min-h-screen max-w-screen-xl mx-auto"
        >
          <Component {...pageProps} />
        </div>
        <Footer />
      </ContextProvider>
    </>
  );
};

export default App;
