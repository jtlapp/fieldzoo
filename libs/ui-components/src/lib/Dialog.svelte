<script lang="ts">
  import { createDialog } from "@melt-ui/svelte";
  import Modal from "./Modal.svelte";

  const {
    elements: {
      trigger,
      portalled,
      overlay,
      content,
      title,
      description,
      close,
    },
    states: { open },
  } = createDialog();
</script>

<slot name="trigger" trigger={$trigger} />
<div use:portalled>
  {#if $open}
    <Modal {overlay} {content} {title} {description} {close}>
      <slot name="title" slot="title" />
      <slot name="description" slot="description" />
      <slot name="content" slot="content" />
      <slot name="buttons" slot="buttons" {open} close={$close} />
    </Modal>
  {/if}
</div>
