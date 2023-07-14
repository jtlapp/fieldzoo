<script lang="ts">
  export let classes = "";
  export let variant: "primary" | "secondary" | "ghost" = "primary";

  classes +=
    " flex flex-row items-center justify-center rounded-md font-medium";
</script>

{#if variant == "ghost"}
  <button class="foreground bg-background {classes}" type="button">
    <slot />
  </button>
{:else}
  <button
    class="text-{variant}-foreground bg-{variant} {classes}"
    type="button"
  >
    <slot />
  </button>
{/if}
