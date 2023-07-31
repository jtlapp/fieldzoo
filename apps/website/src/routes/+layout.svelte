<script lang="ts">
  import "$styles/app.css";
  import "$styles/menu.css";
  import "$styles/forms.css";
  import HeaderBar from "./HeaderBar.svelte";

  import type { LayoutData } from "./$types";

  export let data: LayoutData;

  $: session = data.session;
</script>

<div class="container mx-auto text-center">
  <HeaderBar {session} />
  <slot />
</div>
