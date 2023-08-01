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
    <div melt={$overlay} class="fixed inset-0 z-40 bg-black/50" />
    <div
      class="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw]
                  max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-md bg-white
                  p-[25px] shadow-lg"
      melt={$dialogContent}
    >
      <div
        melt={$tabsRoot}
        class="flex max-w-[25rem] flex-col overflow-hidden rounded-md shadow-lg
  data-[orientation=vertical]:flex-row"
      >
        <div
          melt={$tabsList}
          class="border-magnum-100 flex shrink-0 overflow-x-auto border-b bg-white
    data-[orientation=vertical]:flex-col data-[orientation=vertical]:border-r"
          aria-label="Manage your account"
        >
          <button melt={$tabsTrigger("signup")} class="trigger">Sign Up</button>
          <button melt={$tabsTrigger("login")} class="trigger">Login</button>
        </div>
        <div melt={$tabsContent("signup")} class="grow bg-white p-5">
          <p
            melt={$dialogDescription}
            class="mb-5 mt-[10px] leading-normal text-zinc-600"
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
          <Button variant="primary" on:click={() => signUp(open)}
            >Sign Up</Button
          >
        </div>
        <div melt={$tabsContent("login")} class="grow bg-white p-5">
          <p
            melt={$dialogDescription}
            class="mb-5 mt-[10px] leading-normal text-zinc-600"
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
          <Button variant="primary" on:click={() => login(open)}>Login</Button>
        </div>
      </div>
    </div>
    <button
      melt={$close}
      class="text-magnum-800 hover:bg-magnum-100 focus:shadow-magnum-400 absolute right-[10px] top-[10px]
                    inline-flex h-[25px] w-[25px] appearance-none items-center
                    justify-center rounded-full"
    >
      <XIcon />
    </button>
  {/if}
</div>
