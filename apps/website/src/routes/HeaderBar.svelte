<script lang="ts">
  import type { Session } from "lucia";

  import { Button } from "ui-components";

  import { SITE_NAME } from "$lib/constants";
  import LoggedInMenu from "./LoggedInMenu.svelte";
  import DarkModeToggle from "./DarkModeToggle.svelte";

  export let session: Session | null;

  const signUp = () => {
    console.log("**** clicked signup");
    window.location.href = "/auth/signup";
  };
  const login = () => {
    console.log("**** clicked login");
    window.location.href = "/auth/login";
  };
</script>

<div class="flex flex-row items-center justify-between py-2">
  <a class="text-lg font-medium" href="/">
    {SITE_NAME}
  </a>
  <div class="flex flex-nowrap items-center">
    {#if session}
      <LoggedInMenu {session} />
    {:else}
      <Button variant="ghost" class="mr-3" on:click={signUp}>Sign up</Button>
      <Button variant="primary" class="mr-3" on:click={login}>Login</Button>
    {/if}
    <DarkModeToggle class="ml-3 flex scale-90" />
  </div>
</div>
