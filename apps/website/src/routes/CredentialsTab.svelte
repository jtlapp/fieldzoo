<script lang="ts">
  import { type createTabs, melt } from "@melt-ui/svelte";

  export let tabsTrigger: ReturnType<typeof createTabs>["elements"]["trigger"];
  export let value: string;
  export let label: string;
</script>

<button
  use:melt={$tabsTrigger(value)}
  class="trigger data-[state=active]:border-primary border-b-3 hover:bg-selectable-highlight hover:text-selectable-foreground w-1/3 rounded-t-md border-transparent py-1"
  >{label}</button
>
