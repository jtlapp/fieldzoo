<script lang="ts">
  import XIcon from "@/icons/XIcon.svelte";
  import { type createDialog, melt } from "@melt-ui/svelte";

  export let close: ReturnType<typeof createDialog>["elements"]["close"];
</script>

<button
  use:melt={$close}
  class="text-foreground/80 focus:shadow-ring hover:text-selectable absolute right-[10px] top-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full"
>
  <XIcon />
</button>
