<script lang="ts">
  // modified from https://dev.to/willkre/persistent-theme-switch-dark-mode-with-svelte-sveltekit-tailwind-1b9g

  import { browser } from "$app/environment";
  import { DarkLightIcon } from "ui-components";

  let classes = "";
  export { classes as class };

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

<div class={classes}>
  <input
    id="theme-toggle"
    checked={darkMode}
    on:click={handleSwitchDarkMode}
    type="checkbox"
  />
  <label for="theme-toggle">
    <DarkLightIcon class="fill-foreground dark:fill-dark-foreground" />
  </label>
</div>

<style lang="postcss">
  #theme-toggle {
    @apply invisible w-0;
  }

  #theme-toggle + label {
    @apply inline-block h-5 w-5 cursor-pointer;
  }
</style>
