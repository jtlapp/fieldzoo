import Head from "next/head";
import { useSession } from "@supabase/auth-helpers-react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const session = useSession();
  const supabase = useSupabaseClient();
  const login = () => {
    router.push("/auth/login");
  };
  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="container mx-auto text-slate-50">
      <Head>
        <title>FieldZoo Demo</title>
      </Head>
      {!session ? (
        <button className="btn-sm btn-secondary" onClick={login}>
          Login
        </button>
      ) : (
        <button className="btn-sm btn-secondary" onClick={logout}>
          Logout
        </button>
      )}
    </div>
  );
}
