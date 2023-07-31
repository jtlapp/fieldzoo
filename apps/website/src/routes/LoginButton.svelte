<script lang="ts">
  import type { createDialog } from "@melt-ui/svelte";

  import { Button, Dialog } from "ui-components";

  const credentials = {
    email: "",
    password: "",
  };

  async function login(open: ReturnType<typeof createDialog>["open"]) {
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });
    open.set(false);

    if (response.ok) {
      location.reload();
    } else {
      alert("Invalid credentials");
    }
  }
</script>

<Dialog>
  <Button
    slot="trigger"
    variant="primary"
    class="mr-3"
    let:trigger
    action={trigger.action}>Login</Button
  >
  <h2 slot="title">Login</h2>
  <p slot="description">Please enter your credentials</p>
  <div slot="content">
    <fieldset class="h-field">
      <label class="w-[90px]" for="email">Email Address</label>
      <input id="email" bind:value={credentials.email} />
    </fieldset>
    <fieldset class="h-field">
      <label class="w-[90px]" for="password">Password</label>
      <input id="password" type="password" bind:value={credentials.password} />
    </fieldset>
  </div>
  <div slot="buttons" let:open>
    <Button variant="primary" on:click={() => login(open)}>Login</Button>
    <a href="/auth/signup">Create an account</a>
  </div>
</Dialog>
