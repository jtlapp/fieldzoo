<script lang="ts">
  import { Button } from "ui-components";
  import { DownCaret } from "ui-components";
  import { createDropdownMenu } from "@melt-ui/svelte";
  const { menu, item, trigger, arrow } = createDropdownMenu();
</script>

<div melt={$trigger} />
<Button {...$trigger} action={$trigger.action} variant="ghost">
  username <DownCaret class="h-4 w-4" style="margin-right: -4px" />
</Button>
<div {...$menu} use:$menu.action>
  <div {...$item} use:item>Log out</div>
  <div {...$arrow} use:$arrow.action />
</div>
