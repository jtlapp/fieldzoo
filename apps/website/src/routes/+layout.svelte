<script>
  import "../app.css";
  import HeaderBar from "./HeaderBar.svelte";
</script>

<div class="container mx-auto text-center">
  <HeaderBar />
  <slot />
</div>
