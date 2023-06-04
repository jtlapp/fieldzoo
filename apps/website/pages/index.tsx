import Head from "next/head";
import Link from "next/link";
import { useSession } from "@supabase/auth-helpers-react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export default function Home() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const logout = () => async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="container mx-auto text-slate-50">
      <Head>
        <title>FieldZoo Demo</title>
      </Head>
      {!session ? (
        <Link href="/auth/login">Login</Link>
      ) : (
        <Link href="#" onClick={logout()}>
          Logout
        </Link>
      )}
    </div>
  );
}
