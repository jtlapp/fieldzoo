<script lang="ts">
  import { Button, MenuItem } from "ui-components";
  import { DownCaretIcon, DropdownMenu } from "ui-components";
</script>

<DropdownMenu>
  <Button slot="trigger" let:trigger action={trigger.action} variant="ghost">
    username <DownCaretIcon class="mr-[-4px] h-4 w-4" />
  </Button>
  <svelte:fragment slot="menu" let:item>
    <MenuItem {item}>Log out</MenuItem>
  </svelte:fragment>
</DropdownMenu>
