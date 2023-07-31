<script lang="ts">
  import type { Session } from "lucia";

  import { Button } from "ui-components";
  import { DownCaretIcon, DropdownMenu } from "ui-components";

  export let session: Session;

  async function logout() {
    await fetch("/api/v1/auth/logout");
    window.location.reload();
  }
</script>

<DropdownMenu>
  <Button slot="trigger" let:trigger action={trigger.action} variant="ghost">
    {session.user.email}
    <DownCaretIcon class="mr-[-4px] h-4 w-4" />
  </Button>
  <svelte:fragment slot="menu" let:item>
    <button class="menu-item" melt={item} on:click={logout}>Log out</button>
  </svelte:fragment>
</DropdownMenu>
