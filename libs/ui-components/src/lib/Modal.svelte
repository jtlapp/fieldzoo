<script lang="ts">
  import type { createDialog } from "@melt-ui/svelte";
  import XIcon from "@/icons/XIcon.svelte";

  // Usage:
  //
  //   script that forces modal to stay open:
  //     const { overlay, content, title, description, open } = createDialog();
  //     open.subscribe(() => open.set(true));

  //   <Modal {overlay} {content} {title} {description}>
  //     <h2 slot="title">Title</h2>
  //     <p slot="description">Description</p>
  //     <div slot="content">content</div>
  //     <div slot="buttons">buttons</div>
  //   </Modal>

  export let title: ReturnType<typeof createDialog>["title"];
  export let description: ReturnType<typeof createDialog>["description"];
  export let overlay: ReturnType<typeof createDialog>["overlay"];
  export let content: ReturnType<typeof createDialog>["content"];
  export let close: ReturnType<typeof createDialog>["close"] | undefined =
    undefined;
</script>

<div melt={$overlay} class="fixed inset-0 z-40 bg-black/50" />
<div
  class="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw]
                max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-md bg-white
                p-[25px] shadow-lg"
  melt={$content}
>
  <h2 melt={$title} class="m-0 text-lg font-medium text-black">
    <slot name="title" />
  </h2>
  <p melt={$description} class="mb-5 mt-[10px] leading-normal text-zinc-600">
    <slot name="description" />
  </p>

  <slot name="content" />

  <div class="mt-[25px] flex justify-end gap-4">
    {#if close === undefined}
      <slot name="buttons" />
    {:else}
      <slot name="buttons" close={$close} />
    {/if}
  </div>

  {#if close !== undefined}
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
