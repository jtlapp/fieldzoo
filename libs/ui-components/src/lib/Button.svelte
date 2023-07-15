<script lang="ts">
  export let classes = "";
  export let variant: "primary" | "secondary" | "ghost" = "primary";

  classes +=
    " flex flex-row items-center justify-center rounded-md font-medium px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
</script>

{#if variant == "ghost"}
  <button
    class="foreground bg-background hover:bg-foreground/10 hover:shadow-md {classes}"
    type="button"
  >
    <slot />
  </button>
{:else}
  <button
    class="text-{variant}-foreground bg-{variant} hover:bg-{variant}/90 shadow-md {classes}"
    type="button"
  >
    <slot />
  </button>
{/if}
