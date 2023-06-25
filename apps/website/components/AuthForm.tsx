"use client";

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { I18nVariables, ThemeSupa } from "@supabase/auth-ui-shared";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

type Props = {
  theme: "light" | "dark";
  title: string;
  view: "sign_in" | "sign_up";
  alternateUrl: string;
  alternateText: string;
  redirectUrl: string;
  variables?: I18nVariables;
};

export default function AuthForm({
  theme,
  title,
  view,
  alternateUrl,
  alternateText,
  redirectUrl,
  variables,
}: Props) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  supabase.auth.onAuthStateChange((event) => {
    if (event == "SIGNED_IN") {
      router.push(redirectUrl);
    }
  });

  return (
    <div className="container mx-auto">
      <Head>
        <title>{title}</title>
      </Head>
      <div className="">
        <h1 className="pt-8 pb-4 text-center text-xl text-slate-50">{title}</h1>
        <Auth
          supabaseClient={supabase}
          view={view}
          showLinks={false}
          appearance={{ theme: ThemeSupa }}
          theme={theme}
          providers={["google", "facebook", "twitter", "linkedin"]}
          socialLayout="horizontal"
          localization={{ variables }}
        />
        <div className="text-center text-md text-slate-50">
          <Link href={alternateUrl}>{alternateText}</Link>
        </div>
      </div>
    </div>
  );
}
