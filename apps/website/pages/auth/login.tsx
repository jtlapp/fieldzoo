"use client";

import Head from "next/head";
import { useRouter } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  supabase.auth.onAuthStateChange((event) => {
    if (event == "SIGNED_IN") {
      router.push("/");
    }
  });

  return (
    <div className="container mx-auto">
      <Head>
        <title>FieldZoo Login</title>
      </Head>
      <div className="">
        <h1 className="pt-8 pb-4 text-center text-xl text-slate-50">
          Login to FieldZoo
        </h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
          providers={["google", "facebook", "linkedin"]}
        />
      </div>
    </div>
  );
}
