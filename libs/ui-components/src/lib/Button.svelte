<script lang="ts">
  let classes = "";
  export { classes as class };
  export let variant: "primary" | "secondary" | "ghost" = "primary";
  export let action: (node: HTMLElement) => void;
</script>

{#if variant == "ghost"}
  <button
    class="text-foreground bg-background hover:bg-menu_highlight hover:text-menu_highlight-foreground hover:shadow-md {classes}"
    type="button"
    use:action
  >
    <slot />
  </button>
{:else if variant == "primary"}
  <button
    class="text-primary-foreground bg-primary hover:bg-primary/90 shadow-md {classes}"
    type="button"
    use:action
  >
    <slot />
  </button>
{:else}
  <button
    class="text-secondary-foreground bg-secondary hover:bg-secondary/90 shadow-md {classes}"
    type="button"
    use:action
  >
    <slot />
  </button>
{/if}

<style lang="postcss">
  button {
    @apply flex flex-row items-center justify-center rounded-md;
    @apply px-2 py-1 text-sm font-medium tracking-wide transition-colors;
    @apply focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2;
    @apply disabled:pointer-events-none disabled:opacity-50;
  }
</style>
