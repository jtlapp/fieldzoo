<script lang="ts">
  import { Button, Dialog } from "ui-components";
</script>

<Dialog title="Login" description="Enter your login credentials.">
  <Button slot="trigger" variant="primary" let:trigger action={trigger.action}
    >Login</Button
  >
  <svelte:fragment slot="content">
    <fieldset class="h-field">
      <label class="w-[90px]" for="username">Username</label>
      <input id="username" />
    </fieldset>
    <fieldset class="h-field">
      <label class="w-[90px]" for="password">Password</label>
      <input id="password" type="password" />
    </fieldset>
  </svelte:fragment>

  <svelte:fragment slot="buttons" let:close>
    <Button variant="primary" action={close.action}>Login</Button>
  </svelte:fragment>
</Dialog>
