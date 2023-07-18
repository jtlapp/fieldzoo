<script lang="ts">
  import { createDialog } from "@melt-ui/svelte";
  import XIcon from "@/icons/XIcon.svelte";

  export let title: string;
  export let description: string;

  const {
    trigger,
    portal,
    overlay,
    content,
    title: meltTitle,
    description: meltDescription,
    close,
    open,
  } = createDialog();
</script>

<slot name="trigger" trigger={$trigger} />
<div use:portal>
  {#if $open}
    <div melt={$overlay} class="fixed inset-0 z-40 bg-black/50" />
    <div
      class="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw]
                max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-md bg-white
                p-[25px] shadow-lg"
      melt={$content}
    >
      <h2 melt={$meltTitle} class="m-0 text-lg font-medium text-black">
        {title}
      </h2>
      <p
        melt={$meltDescription}
        class="mb-5 mt-[10px] leading-normal text-zinc-600"
      >
        {description}
      </p>

      <slot name="content" />

      <div class="mt-[25px] flex justify-end gap-4">
        <slot name="buttons" close={$close} />
      </div>

      <button
        melt={$close}
        class="text-magnum-800 hover:bg-magnum-100 focus:shadow-magnum-400 absolute right-[10px] top-[10px]
                    inline-flex h-[25px] w-[25px] appearance-none items-center
                    justify-center rounded-full"
      >
        <XIcon />
      </button>
    </div>
  {/if}
</div>
