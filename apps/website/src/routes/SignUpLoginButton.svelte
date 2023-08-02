<script lang="ts">
  import { createDialog, createTabs } from "@melt-ui/svelte";

  import { Button, XIcon } from "ui-components";

  import CredentialsForm from "./CredentialsForm.svelte";

  type TabValue = "login" | "signup";

  export let initialTab: TabValue;

  const {
    trigger: dialogTrigger,
    portal,
    overlay,
    description: dialogDescription,
    content: dialogContent,
    close,
    open: dialogOpen,
  } = createDialog();
  const {
    root: tabsRoot,
    list: tabsList,
    content: tabsContent,
    trigger: tabsTrigger,
  } = createTabs({
    value: initialTab,
  });
  const credentials = {
    email: "",
    password: "",
  };

  async function signUp(open: ReturnType<typeof createDialog>["open"]) {
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
      alert("TODO: some sort of error");
    }
  }
</script>

<Button
  {...$dialogTrigger}
  variant="primary"
  class="mr-3"
  action={$dialogTrigger.action}>Login</Button
>
<div use:portal>
  {#if $dialogOpen}
    <div melt={$overlay} class="bg-foreground/50 fixed inset-0 z-40" />
    <div
      class="bg-background fixed left-[50%] top-[50%] z-50 max-h-[85vh]
                  w-[90vw] max-w-[480px] translate-x-[-50%] translate-y-[-50%] rounded-md
                  p-[25px] shadow-lg"
      melt={$dialogContent}
    >
      <div
        melt={$tabsRoot}
        class="flex flex-col
  overflow-hidden data-[orientation=vertical]:flex-row"
      >
        <div
          melt={$tabsList}
          class="flex shrink-0 justify-center overflow-x-auto
    text-lg data-[orientation=vertical]:flex-col"
          aria-label="Manage your account"
        >
          <button
            melt={$tabsTrigger("signup")}
            class="trigger data-[state=active]:border-primary border-b-3 hover:bg-selectable-highlight hover:text-selectable-foreground w-1/3 rounded-t-md border-transparent py-1"
            >Sign Up</button
          >
          <button
            melt={$tabsTrigger("login")}
            class="trigger data-[state=active]:border-primary border-b-3 hover:bg-selectable-highlight hover:text-selectable-foreground w-1/3 rounded-t-md border-transparent py-1"
            >Login</button
          >
        </div>
        <div melt={$tabsContent("signup")} class="grow py-2">
          <CredentialsForm
            {credentials}
            {dialogDescription}
            {dialogOpen}
            action={signUp}
            instructions="Please choose your login credentials."
            buttonText="Sign Up"
          />
        </div>
        <div melt={$tabsContent("login")} class="grow py-2">
          <CredentialsForm
            {credentials}
            {dialogDescription}
            {dialogOpen}
            action={login}
            instructions="Please enter your login credentials."
            buttonText="Login"
          />
        </div>
        <button
          melt={$close}
          class="text-foreground/80 focus:shadow-ring absolute right-[10px] top-[10px]
                      inline-flex h-[25px] w-[25px] appearance-none items-center
                      justify-center rounded-full"
        >
          <XIcon />
        </button>
      </div>
    </div>
  {/if}
</div>
