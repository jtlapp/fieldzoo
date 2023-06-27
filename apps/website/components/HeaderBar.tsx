"use client";

import { useSession } from "@supabase/auth-helpers-react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContrastToggle } from "./ContrastToggle";
import DownCaret from "./DownCaret";

export default function HeaderBar() {
  const session = useSession();
  return (
    <div className="flex flex-row justify-between items-center py-2">
      <Link className="text-lg" href="/">
        Field Zoo
      </Link>
      <div className="flex flex-nowrap items-center">
        {session ? <LoggedInMenu /> : <LoggedOutMenu />}
      </div>
    </div>
  );
}

function LoggedInMenu() {
  const supabase = useSupabaseClient();
  const logout = async () => {
    await supabase.auth.signOut();
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button className="px-2" size="sm" variant="ghost">
            username
            <DownCaret
              className="h-4 w-4 text-primary"
              style={{ marginRight: "-4px" }}
              aria-hidden="true"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ContrastToggle className="ml-1" />
    </>
  );
}

function LoggedOutMenu() {
  return (
    <>
      <Link className="pr-4" href="/auth/signup">
        Sign up
      </Link>
      <Button size="sm" asChild>
        <Link href="/auth/login">Login</Link>
      </Button>
      <ContrastToggle className="ml-2" />
    </>
  );
}
