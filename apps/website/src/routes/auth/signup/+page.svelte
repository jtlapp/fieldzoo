<script lang="ts">
  import { Button } from "ui-components";
  import { enhance } from "$app/forms";
</script>

<h1>Sign up</h1>

<form method="post" use:enhance>
  <fieldset class="h-field">
    <label class="w-[90px]" for="email">Email Address</label>
    <input name="email" id="email" />
  </fieldset>
  <fieldset class="h-field">
    <label class="w-[90px]" for="password">Password</label>
    <input name="password" id="password" type="password" />
  </fieldset>
  <Button variant="primary" type="submit">Sign up</Button>
</form>

<a href="/auth/login">Sign in</a>
