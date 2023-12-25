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
        <title>Melt Finance</title>
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
        <div className="flex flex-col h-screen">
          <Notifications />
          <AppBar />
          <div className="flex-1">
            <Component {...pageProps} />
          </div>
          <Footer />
        </div>
      </ContextProvider>
    </>
  );
};

export default App;
