import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useTheme } from "next-themes";
import * as Tabs from "@radix-ui/react-tabs";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

type Props = {
  initialView: "sign_in" | "sign_up";
  children: React.ReactNode;
};

const commonSupabaseProps = {
  showLinks: false,
  appearance: { theme: ThemeSupa },
  providers: ["google", "facebook", "twitter", "linkedin"] as any,
  socialLayout: "horizontal" as const,
};

export default function AuthDialog({ initialView, children }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  const supabase = useSupabaseClient();
  supabase.auth.onAuthStateChange((event) => {
    if (event == "SIGNED_IN") {
      setOpen(false);
    }
  });
  useEffect(() => setMounted(true), []);

  // prevent server and client render mismatch on value of theme
  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <Tabs.Root className="flex flex-col" defaultValue={initialView}>
          <Tabs.List
            className="shrink-0 flex px-8"
            aria-label="Login or sign up"
          >
            <TabTrigger text="Login" value="sign_in" />
            <TabTrigger text="Sign up" value="sign_up" />
          </Tabs.List>
          <Tabs.Content value="sign_in">
            <Auth
              supabaseClient={supabase}
              view={"sign_in"}
              theme={theme}
              localization={{
                variables: {
                  sign_in: {
                    button_label: "Login",
                    loading_button_label: "Logging in ...",
                    social_provider_text: "Login with {{provider}}",
                  },
                },
              }}
              {...commonSupabaseProps}
            />
          </Tabs.Content>
          <Tabs.Content value="sign_up">
            <Auth
              supabaseClient={supabase}
              view={"sign_up"}
              theme={theme}
              {...commonSupabaseProps}
            />
          </Tabs.Content>
        </Tabs.Root>
      </DialogContent>
    </Dialog>
  );
}

function TabTrigger(props: { text: string; value: string }) {
  return (
    <Tabs.Trigger
      className="flex-1 flex items-center justify-center text-lg select-none data-[state=active]:focus:relative pb-1 mb-4 data-[state=active]:border-b-primary data-[state=inactive]:border-b-background outline-none cursor-default"
      style={{ borderBottomWidth: "2px" }}
      value={props.value}
    >
      {props.text}
    </Tabs.Trigger>
  );
}
