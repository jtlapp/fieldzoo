<script lang="ts" context="module">
  import type { ButtonType } from "./Button.svelte";

  export type ButtonDef = {
    label: string;
    variant: ButtonType;
    action: () => void;
  };
</script>

<script lang="ts">
  import { createDialog } from "@melt-ui/svelte";
  import XIcon from "@/icons/XIcon.svelte";
  import Button from "./Button.svelte";

  export let title: string;
  export let description: string;
  export let buttons: ButtonDef[] = [];
  export let setAction: (action: (node: HTMLElement) => void) => void;

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

  setAction($trigger.action);
</script>

<slot name="trigger" {...$trigger} />
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
        {#each buttons as { label, variant, action }}
          <Button
            {...$close}
            {variant}
            action={(elem) => {
              $close.action(elem);
              action();
            }}>{label}</Button
          >
        {/each}
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
