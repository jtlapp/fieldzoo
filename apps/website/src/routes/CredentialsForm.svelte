<script lang="ts">
  import type { createDialog } from "@melt-ui/svelte";

  import { Button } from "ui-components";

  // TODO: base on Credentials type
  export let credentials: {
    email: string;
    password: string;
  };
  export let dialogDescription: ReturnType<typeof createDialog>["description"];
  export let dialogOpen: ReturnType<typeof createDialog>["open"];
  export let instructions: String;
  export let buttonText: String;
  export let action: (open: typeof dialogOpen) => void;
</script>

<p
  melt={$dialogDescription}
  class="text-foreground/75 mb-5 mt-[10px] text-center leading-normal"
>
  {instructions}
</p>

<fieldset class="h-field">
  <label class="w-[108px]" for="email">Email Address</label>
  <input
    id="email"
    class="dark:text-background"
    bind:value={credentials.email}
  />
</fieldset>
<fieldset class="h-field">
  <label class="w-[108px]" for="password">Password</label>
  <input
    id="password"
    class="dark:text-background"
    type="password"
    bind:value={credentials.password}
  />
</fieldset>
<div class="flex flex-col items-center pt-3">
  <Button variant="primary" size="lg" on:click={() => action(dialogOpen)}
    >{buttonText}</Button
  >
</div>
