import { AppProps } from "next/app";
import Head from "next/head";
import { FC } from "react";
import { ContextProvider } from "../contexts/ContextProvider";
import { AppBar } from "../components/AppBar";
import { Footer } from "../components/Footer";
import Notifications from "../components/Notification";
import { Aclonica } from "next/font/google";

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
          h3 {
            font-family: ${aclonica.style.fontFamily}, sans-serif;
          }
        `}
      </style>

      <ContextProvider>
        <Notifications />
        <AppBar />
        <div className="m-10 min-h-screen">
          <Component {...pageProps} />
        </div>
        <Footer />
      </ContextProvider>
    </>
  );
};

export default App;
