<script>
  import "$styles/app.css";
  import "$styles/forms.css";
  import HeaderBar from "./HeaderBar.svelte";
</script>

<div class="container mx-auto text-center">
  <HeaderBar />
  <slot />
</div>
