<script lang="ts">
  import { Button } from "ui-components";
  import { DownCaretIcon, DropdownMenu } from "ui-components";

  async function logout() {
    await fetch("/auth/logout");
    window.location.reload();
  }
</script>

<DropdownMenu>
  <Button slot="trigger" let:trigger action={trigger.action} variant="ghost">
    username <DownCaretIcon class="mr-[-4px] h-4 w-4" />
  </Button>
  <svelte:fragment slot="menu" let:item>
    <button class="menu-item" melt={item} on:click={logout}>Log out</button>
  </svelte:fragment>
</DropdownMenu>
