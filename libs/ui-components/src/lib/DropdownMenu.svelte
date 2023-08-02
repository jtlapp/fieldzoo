<script lang="ts">
  import { createDropdownMenu, melt } from "@melt-ui/svelte";

  const {
    elements: { menu, item, trigger },
  } = createDropdownMenu();
</script>

<slot name="trigger" trigger={$trigger} />
<div class="dropdown-menu" use:melt={$menu}>
  <slot name="menu" item={$item} />
</div>

<style lang="postcss">
  .dropdown-menu {
    @apply z-10 flex max-h-[300px] min-w-[220px] flex-col shadow-lg;
    @apply bg-background rounded-md p-1 shadow-neutral-900/30 lg:max-h-none;
    @apply border-foreground border-2 border-opacity-10;
    @apply ring-0 !important;
  }
</style>
