<script lang="ts">
  import { createDialog } from "@melt-ui/svelte";

  import { Button, Modal } from "ui-components";

  const credentials = {
    email: "",
    password: "",
  };

  const { overlay, content, title, description, open } = createDialog();
  open.subscribe(() => open.set(true));

  async function submit() {
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (response.ok) {
      window.location.href = "/";
    } else {
      alert("Invalid credentials");
    }
  }
</script>

<Modal {overlay} {content} {title} {description}>
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
  <div slot="buttons">
    <Button variant="primary" on:click={submit}>Login</Button>
    <a href="/auth/signup">Create an account</a>
  </div>
</Modal>
