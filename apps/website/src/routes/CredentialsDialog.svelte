<script lang="ts">
  import { writable } from "svelte/store";
  import { createDialog, createTabs, melt } from "@melt-ui/svelte";

  import { DialogCloseX } from "ui-components";

  import CredentialsTab from "./CredentialsTab.svelte";
  import CredentialsForm from "./CredentialsForm.svelte";

  const tabsValue = writable("");

  const {
    elements: {
      trigger: dialogTrigger,
      portalled,
      overlay,
      description: dialogDescription,
      content: dialogContent,
      close,
    },
    states: { open: dialogOpen },
  } = createDialog();
  const {
    elements: {
      root: tabsRoot,
      list: tabsList,
      content: tabsContent,
      trigger: tabsTrigger,
    },
  } = createTabs({ value: tabsValue });
  const credentials = {
    email: "",
    password: "",
  };

  async function signUp(
    open: ReturnType<typeof createDialog>["states"]["open"]
  ) {
    const response = await fetch("/api/v1/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });
    open.set(false);

    if (response.ok) {
      // TODO: enforce userID type
      const { userID } = await response.json();
      window.location.href = "/auth/email-verification/" + userID;
    } else {
      alert("TODO: some sort of error");
    }
  }

  async function login(
    open: ReturnType<typeof createDialog>["states"]["open"]
  ) {
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
      alert("TODO: some sort of error");
    }
  }
</script>

<slot name="triggers" dialogTrigger={$dialogTrigger} {tabsValue} />
<div use:melt={$portalled}>
  {#if $dialogOpen}
    <div use:melt={$overlay} class="bg-foreground/50 fixed inset-0 z-40" />
    <div
      class="bg-background fixed left-[50%] top-[50%] z-50 max-h-[85vh]
                  w-[90vw] max-w-[480px] translate-x-[-50%] translate-y-[-50%] rounded-md
                  p-[25px] shadow-lg"
      use:melt={$dialogContent}
    >
      {#key $tabsValue}
        <div
          use:melt={$tabsRoot}
          class="flex flex-col
  overflow-hidden data-[orientation=vertical]:flex-row"
        >
          <div
            use:melt={$tabsList}
            class="flex shrink-0 justify-center overflow-x-auto
    text-lg data-[orientation=vertical]:flex-col"
            aria-label="Manage your account"
          >
            <CredentialsTab {tabsTrigger} value="signup" label="Sign Up" />
            <CredentialsTab {tabsTrigger} value="login" label="Login" />
          </div>
          <div use:melt={$tabsContent("signup")} class="grow py-2">
            <CredentialsForm
              {credentials}
              {dialogDescription}
              {dialogOpen}
              action={signUp}
              instructions="Please choose your login credentials."
              actionText="Sign Up"
            />
          </div>
          <div use:melt={$tabsContent("login")} class="grow py-2">
            <CredentialsForm
              {credentials}
              {dialogDescription}
              {dialogOpen}
              action={login}
              instructions="Please enter your login credentials."
              actionText="Login"
            />
          </div>
          <DialogCloseX {close} />
        </div>
      {/key}
    </div>
  {/if}
</div>
