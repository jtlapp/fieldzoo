import { useSession } from "@supabase/auth-helpers-react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HeaderBar() {
  const session = useSession();
  return (
    <div className="flex flex-row justify-between items-center py-2">
      <Link className="text-lg" href="/">
        Field Zoo
      </Link>
      <div>{session ? <LoggedInMenu /> : <LoggedOutMenu />}</div>
    </div>
  );
}

function LoggedInMenu() {
  const supabase = useSupabaseClient();
  const logout = async () => {
    await supabase.auth.signOut();
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex">
        username&nbsp;
        <ChevronDownIcon
          className="h-4 w-4 mt-1 text-primary-foreground"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LoggedOutMenu() {
  return (
    <>
      <Link className="pr-4" href="/auth/signup">
        Sign up
      </Link>
      <Button asChild>
        <Link href="/auth/login">Login</Link>
      </Button>
    </>
  );
}
