"use client";

import Head from "next/head";
import Link from "next/link";
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
          Sign Up for FieldZoo
        </h1>
        <Auth
          supabaseClient={supabase}
          view="sign_up"
          showLinks={false}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
          providers={["google", "facebook", "twitter", "linkedin"]}
          socialLayout="horizontal"
        />
        <div className="text-center text-md text-slate-50">
          <Link className="text-center text-slate-50" href="/auth/login">
            Login to an existing account
          </Link>
        </div>
      </div>
    </div>
  );
}
