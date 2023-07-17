<script lang="ts">
  import { Button, Dialog } from "ui-components";

  const buttons = [
    {
      label: "Login",
      variant: "primary" as const,
      action: () => console.log("Login"),
    },
  ];

  let action: (node: HTMLElement) => void;
</script>

<Dialog
  title="Login"
  description="Enter your login credentials."
  {buttons}
  setAction={(a) => (action = a)}
>
  <Button slot="trigger" variant="primary" {action}>Login</Button>
  <svelte:fragment slot="content">
    <fieldset class="mb-4 flex items-center gap-5">
      <label class="text-magnum-800 w-[90px] text-right" for="username">
        Username
      </label>
      <input
        class="text-magnum-800 inline-flex h-8 w-full flex-1 items-center
                      justify-center rounded-sm border border-solid px-3 leading-none"
        id="username"
      />
    </fieldset>
    <fieldset class="mb-4 flex items-center gap-5">
      <label class="text-magnum-800 w-[90px] text-right" for="password">
        Password
      </label>
      <input
        class="text-magnum-800 inline-flex h-8 w-full flex-1 items-center
                      justify-center rounded-sm border border-solid px-3 leading-none"
        id="password"
        type="password"
      />
    </fieldset>
  </svelte:fragment>
</Dialog>
