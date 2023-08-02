<script lang="ts">
  import type { createTabs } from "@melt-ui/svelte";

  export let tabsTrigger: ReturnType<typeof createTabs>["trigger"];
  export let value: string;
  export let label: string;
</script>

<button
  melt={$tabsTrigger(value)}
  class="trigger data-[state=active]:border-primary border-b-3 hover:bg-selectable-highlight hover:text-selectable-foreground w-1/3 rounded-t-md border-transparent py-1"
  >{label}</button
>
