<script lang="ts">
  // modified from https://dev.to/willkre/persistent-theme-switch-dark-mode-with-svelte-sveltekit-tailwind-1b9g

  import { browser } from "$app/environment";

  let darkMode = true;

  function handleSwitchDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem("theme", darkMode ? "dark" : "light");

    darkMode
      ? document.documentElement.classList.add("dark")
      : document.documentElement.classList.remove("dark");
  }

  if (browser) {
    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      darkMode = true;
    } else {
      document.documentElement.classList.remove("dark");
      darkMode = false;
    }
  }
</script>

<div>
  <input
    id="theme-toggle"
    checked={darkMode}
    on:click={handleSwitchDarkMode}
    type="checkbox"
  />
  <label for="theme-toggle">
    <svg
      class="fill-foreground dark:fill-dark-foreground"
      viewBox="0 0 20 20"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      ><g stroke-width="0" /><g
        stroke-linecap="round"
        stroke-linejoin="round"
      /><g
        ><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"
          ><g
            class="fill-foreground dark:fill-dark-foreground"
            transform="translate(-180.000000, -4199.000000)"
            ><g transform="translate(56.000000, 160.000000)"
              ><path
                d="M126,4049 C126,4044.589 129.589,4041 134,4041 L134,4057 C129.589,4057 126,4053.411 126,4049 M134,4039 C128.477,4039 124,4043.477 124,4049 C124,4054.523 128.477,4059 134,4059 C139.523,4059 144,4054.523 144,4049 C144,4043.477 139.523,4039 134,4039"
              /></g
            ></g
          ></g
        ></g
      ></svg
    >
  </label>
</div>

<style lang="postcss">
  #theme-toggle {
    @apply invisible;
  }

  #theme-toggle + label {
    @apply inline-block h-5 w-5 cursor-pointer;
  }
</style>
