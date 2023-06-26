import { useSession } from "@supabase/auth-helpers-react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";

export default function HeaderBar() {
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
    <div className="flex flex-row justify-between items-center py-2">
      <div>Field Zoo</div>
      <div className="text-slate-50">
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
    </div>
  );
}
