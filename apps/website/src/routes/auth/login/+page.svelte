<script lang="ts">
  import { Button } from "ui-components";

  // TODO: maybe used shared Credentials
  const data = {
    email: "",
    password: "",
  };

  async function submit() {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      window.location.href = "/";
    } else {
      alert("Invalid login");
    }
  }
</script>

<h1>Login</h1>

<fieldset class="h-field">
  <label class="w-[90px]" for="email">Email Address</label>
  <input id="email" bind:value={data.email} />
</fieldset>
<fieldset class="h-field">
  <label class="w-[90px]" for="password">Password</label>
  <input id="password" type="password" bind:value={data.password} />
</fieldset>

<Button variant="primary" on:click={submit}>Login</Button>

<a href="/auth/signup">Create an account</a>
