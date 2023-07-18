<script lang="ts">
  import type { createDropdownMenu } from "@melt-ui/svelte";

  import { MeltValue } from "./ui-type-tools";

  export let item: MeltValue<typeof createDropdownMenu, "item">;
</script>

<div class="menu-item" melt={item}><slot /></div>

<style lang="postcss">
  .menu-item {
    @apply relative h-[25px] min-h-[25px] select-none rounded-sm pl-6 pr-1;
    @apply text-foreground z-20 outline-none;
    @apply data-[highlighted]:bg-menu_highlight data-[highlighted]:text-menu_highlight-foreground;
    @apply data-[disabled]:text-muted-foreground;
    @apply flex items-center text-sm leading-none;
    @apply ring-0 !important;
  }
</style>
