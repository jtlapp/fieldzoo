<script lang="ts">
  import { createDialog } from "@melt-ui/svelte";
  import Modal from "./Modal.svelte";

  const { trigger, portal, overlay, content, title, description, close, open } =
    createDialog();
</script>

<slot name="trigger" trigger={$trigger} />
<div use:portal>
  {#if $open}
    <Modal {overlay} {content} {title} {description} {close}>
      <slot name="title" slot="title" />
      <slot name="description" slot="description" />
      <slot name="content" slot="content" />
      <slot name="buttons" slot="buttons" />
    </Modal>
  {/if}
</div>
