<script lang="ts" context="module">
  export type ButtonType = "primary" | "secondary" | "ghost";
  export type ButtonSize = "sm" | "md" | "lg";
</script>

<script lang="ts">
  let classes = "";
  let buttonType: "submit" | "button" | "reset" = "button";
  export { classes as class };
  export { buttonType as type };
  export let variant: ButtonType = "primary";
  export let size: "sm" | "md" | "lg" = "md";
  export let action = (_node: HTMLElement) => {};

  const selectable = "border-2 border-background hover:border-selectable";
  const sizes = {
    sm: "px-1 text-sm",
    md: "px-2 py-1 text-sm",
    lg: "px-4 pt-1 pb-[6px] text-md",
  };
</script>

{#if variant == "ghost"}
  <button
    class="text-foreground bg-background hover:shadow-md {selectable} {sizes[
      size
    ]} {classes}"
    type={buttonType}
    use:action
    on:click
  >
    <slot />
  </button>
{:else if variant == "primary"}
  <button
    class="text-primary-foreground bg-primary {selectable} {sizes[
      size
    ]} {classes}"
    type={buttonType}
    use:action
    on:click
  >
    <slot />
  </button>
{:else}
  <button
    class="text-secondary-foreground bg-secondary shadow-md {selectable} {sizes[
      size
    ]} {classes}"
    type={buttonType}
    use:action
    on:click
  >
    <slot />
  </button>
{/if}

<style lang="postcss">
  button {
    @apply flex flex-row items-center justify-center rounded-lg;
    @apply font-medium tracking-wide transition-colors;
    @apply focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2;
    @apply disabled:pointer-events-none disabled:opacity-50;
  }
</style>
