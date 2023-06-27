"use client";

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { I18nVariables, ThemeSupa } from "@supabase/auth-ui-shared";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useTheme } from "next-themes";

type Props = {
  title: string;
  view: "sign_in" | "sign_up";
  alternateUrl: string;
  alternateText: string;
  redirectUrl: string;
  variables?: I18nVariables;
};

export default function AuthForm({
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
  const { theme } = useTheme();

  return (
    <div className="container mx-auto">
      <Head>
        <title>{title}</title>
      </Head>
      <div className="">
        <h1 className="pt-8 pb-4 text-center text-xl text-primary">{title}</h1>
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
        <div className="text-center text-md text-primary">
          <Link href={alternateUrl}>{alternateText}</Link>
        </div>
      </div>
    </div>
  );
}
