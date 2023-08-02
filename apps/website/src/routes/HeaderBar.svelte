<script lang="ts">
  import type { Session } from "lucia";

  import { Button } from "ui-components";

  import { SITE_NAME } from "$lib/constants";
  import LoggedInMenu from "./LoggedInMenu.svelte";
  import DarkModeToggle from "./DarkModeToggle.svelte";
  import CredentialsDialog from "./CredentialsDialog.svelte";

  export let session: Session | null;
</script>

<div class="flex flex-row items-center justify-between py-2">
  <a class="text-lg font-medium" href="/">
    {SITE_NAME}
  </a>
  <div class="flex flex-nowrap items-center">
    {#if session}
      <LoggedInMenu {session} />
    {:else}
      <CredentialsDialog>
        <svelte:fragment slot="triggers" let:dialogTrigger let:tabsValue>
          <Button
            variant="ghost"
            class="mr-3"
            action={dialogTrigger.action}
            on:click={() => tabsValue.set("signup")}>Sign up</Button
          >
          <Button
            variant="primary"
            class="mr-3"
            action={dialogTrigger.action}
            on:click={() => tabsValue.set("login")}>Login</Button
          >
        </svelte:fragment>
      </CredentialsDialog>
    {/if}
    <DarkModeToggle class="ml-3 flex scale-90" />
  </div>
</div>
