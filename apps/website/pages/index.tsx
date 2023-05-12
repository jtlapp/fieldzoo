import Head from "next/head";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";

export default function Home() {
  const session = useSession();
  const supabase = useSupabaseClient();

  return (
    <div className="container" style={{ padding: "50px 0 100px 0" }}>
      <Head>
        <title>FieldZoo Demo</title>
      </Head>
      {!session ? (
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
        />
      ) : (
        <p>Account page will go here.</p>
      )}
    </div>
  );
}
