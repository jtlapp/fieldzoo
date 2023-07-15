<script lang="ts">
  import { SITE_NAME } from "@/lib/constants";
  import LoggedInMenu from "./LoggedInMenu.svelte";
  import LoggedOutMenu from "./LoggedOutMenu.svelte";
  import DarkModeToggle from "./DarkModeToggle.svelte";

  const session = true;
</script>

<div class="flex flex-row items-center justify-between py-2">
  <a class="text-lg" href="/">
    {SITE_NAME}
  </a>
  <div class="flex flex-nowrap items-center">
    {#if session}
      <LoggedInMenu />
    {:else}
      <LoggedOutMenu />
    {/if}
    <DarkModeToggle class="flex scale-90 pl-2" />
  </div>
</div>
