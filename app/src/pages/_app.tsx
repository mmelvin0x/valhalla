import { AppProps } from "next/app";
import { Aclonica } from "next/font/google";
import Head from "next/head";
import { FC } from "react";
import Notifications from "../components/notifications/Notification";
import { AppBar } from "../components/ui/AppBar";
import { Footer } from "../components/ui/Footer";
import { ContextProvider } from "../contexts/ContextProvider";

const aclonica = Aclonica({
  subsets: ["latin"],
  weight: "400",
});

require("../styles/globals.css");
require("@solana/wallet-adapter-react-ui/styles.css");
require("react-datepicker/dist/react-datepicker.css");

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
        <div className="m-10 min-h-screen">
          <Component {...pageProps} />
        </div>
        <Footer />
      </ContextProvider>
    </>
  );
};

export default App;
