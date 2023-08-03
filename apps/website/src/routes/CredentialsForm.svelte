<script lang="ts">
  import { type createDialog, melt } from "@melt-ui/svelte";

  import { Button } from "ui-components";
  import type { UnvalidatedFields } from "@fieldzoo/generic-types";

  import type { Credentials } from "$lib/credentials";

  export let credentials: UnvalidatedFields<Credentials>;
  export let dialogDescription: ReturnType<
    typeof createDialog
  >["elements"]["description"];
  export let dialogOpen: ReturnType<typeof createDialog>["states"]["open"];
  export let instructions: String;
  export let actionText: String;
  export let action: (open: typeof dialogOpen) => void;
</script>

<p
  use:melt={$dialogDescription}
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
    >{actionText}</Button
  >
</div>
