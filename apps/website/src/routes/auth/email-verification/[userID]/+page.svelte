<script lang="ts">
  import { enhance } from "$app/forms";
  import type { ActionData, PageData } from "./$types";

  export let data: PageData;
  export let form: ActionData;
</script>

{#if data.emailVerified}
  <h1>Already Verified</h1>
  <p>Your email has already been verified.</p>
  {#if data.session}
    <p>You are logged in.</p>
  {:else}
    <p>You may log in.</p>
  {/if}
{:else}
  <h1>Verification Email Sent</h1>
  <p>Your email verification link was sent to your inbox (i.e. console).</p>
  <h2>Resend verification link</h2>
  <form method="post" use:enhance>
    <input type="submit" value="Resend" />
  </form>
  {#if form?.success}
    <p>Your verification link was resent</p>
  {/if}
{/if}
