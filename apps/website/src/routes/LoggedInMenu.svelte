<script lang="ts">
  import { Button } from "ui-components";
  import { DownCaretIcon } from "ui-components";
  import { createDropdownMenu } from "@melt-ui/svelte";
  import "ui-components/styles/dropdown-menu.css";

  const { menu, item, trigger, arrow } = createDropdownMenu();
</script>

<Button {...$trigger} action={$trigger.action} variant="ghost">
  username <DownCaretIcon class="h-4 w-4" style="margin-right: -4px" />
</Button>
<div class="dropdown-menu" melt={$menu}>
  <div class="menu-item" melt={$item}>Log out</div>
  <div melt={$arrow} />
</div>
