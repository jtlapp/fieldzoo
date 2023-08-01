<script lang="ts">
  import { createDialog, createTabs } from "@melt-ui/svelte";

  import { Button, XIcon } from "ui-components";

  type TabValue = "login" | "signup";

  export let initialTab: TabValue;

  const {
    trigger: dialogTrigger,
    portal,
    overlay,
    description: dialogDescription,
    content: dialogContent,
    close,
    open,
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
  {#if $open}
    <div melt={$overlay} class="bg-foreground/50 fixed inset-0 z-40" />
    <div
      class="bg-background fixed left-[50%] top-[50%] z-50 max-h-[85vh]
                  w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-md
                  p-[25px] shadow-lg"
      melt={$dialogContent}
    >
      <div
        melt={$tabsRoot}
        class="flex max-w-[25rem] flex-col
  overflow-hidden data-[orientation=vertical]:flex-row"
      >
        <div
          melt={$tabsList}
          class="border-primary flex shrink-0 justify-center
    overflow-x-auto data-[orientation=vertical]:flex-col"
          aria-label="Manage your account"
        >
          <button
            melt={$tabsTrigger("signup")}
            class="trigger data-[state=active]:border-primary border-b-3 w-1/3 border-transparent pb-1"
            >Sign Up</button
          >
          <button
            melt={$tabsTrigger("login")}
            class="trigger data-[state=active]:border-primary border-b-3 w-1/3 border-transparent pb-1"
            >Login</button
          >
        </div>
        <div melt={$tabsContent("signup")} class="grow py-2">
          <p
            melt={$dialogDescription}
            class="text-foreground/75 mb-5 mt-[10px] leading-normal"
          >
            Please enter your login credentials.
          </p>

          <fieldset class="h-field">
            <label class="w-[90px]" for="email">Email Address</label>
            <input id="email" bind:value={credentials.email} />
          </fieldset>
          <fieldset class="h-field">
            <label class="w-[90px]" for="password">Password</label>
            <input
              id="password"
              type="password"
              bind:value={credentials.password}
            />
          </fieldset>
          <div class="flex flex-col items-center pt-2">
            <Button variant="primary" on:click={() => signUp(open)}
              >Sign Up</Button
            >
          </div>
        </div>
        <div melt={$tabsContent("login")} class="grow py-2">
          <p
            melt={$dialogDescription}
            class="text-foreground/75 mb-5 mt-[10px] leading-normal"
          >
            Please enter your login credentials.
          </p>
          <fieldset class="h-field">
            <label class="w-[90px]" for="email">Email Address</label>
            <input id="email" bind:value={credentials.email} />
          </fieldset>
          <fieldset class="h-field">
            <label class="w-[90px]" for="password">Password</label>
            <input
              id="password"
              type="password"
              bind:value={credentials.password}
            />
          </fieldset>
          <div class="flex flex-col items-center pt-2">
            <Button variant="primary" on:click={() => login(open)}>Login</Button
            >
          </div>
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
