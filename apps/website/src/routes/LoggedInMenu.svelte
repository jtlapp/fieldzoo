<script lang="ts">
  import { Button, MenuItem } from "ui-components";
  import { DownCaretIcon, DropdownMenu } from "ui-components";
</script>

<DropdownMenu>
  <Button slot="trigger" let:trigger action={trigger.action} variant="ghost">
    username <DownCaretIcon class="h-4 w-4" style="margin-right: -4px" />
  </Button>
  <svelte:fragment slot="menu" let:item>
    <MenuItem {item}>Log out</MenuItem>
  </svelte:fragment>
</DropdownMenu>
