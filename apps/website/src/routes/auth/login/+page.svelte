<script lang="ts">
  import { Button } from "ui-components";

  const credentials = {
    email: "",
    password: "",
  };

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

<h1>Login</h1>

<fieldset class="h-field">
  <label class="w-[90px]" for="email">Email Address</label>
  <input id="email" bind:value={credentials.email} />
</fieldset>
<fieldset class="h-field">
  <label class="w-[90px]" for="password">Password</label>
  <input id="password" type="password" bind:value={credentials.password} />
</fieldset>

<Button variant="primary" on:click={submit}>Login</Button>

<a href="/auth/signup">Create an account</a>
