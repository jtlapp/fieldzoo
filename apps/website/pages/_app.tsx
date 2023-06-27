import type { AppProps } from "next/app";
import { useState } from "react";
import { ThemeProvider } from "next-themes";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider, Session } from "@supabase/auth-helpers-react";

import "../styles/globals.css";
import HeaderBar from "../components/HeaderBar";

export default function MyApp({
  Component,
  pageProps,
}: AppProps<{
  initialSession: Session;
}>) {
  const [supabase] = useState(() => createBrowserSupabaseClient());

  return (
    <SessionContextProvider
      supabaseClient={supabase}
      initialSession={pageProps.initialSession}
    >
      <ThemeProvider attribute="class" defaultTheme="light">
        <div className="container mx-auto">
          <HeaderBar />
          <Component {...pageProps} />
        </div>
      </ThemeProvider>
    </SessionContextProvider>
  );
}
