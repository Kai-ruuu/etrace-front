<script>
	import { twMerge } from "tailwind-merge";
	import TextS from "./TextS.svelte";

    let {
        Icon = null,
        iconRight = false,
        label = '',
        disabled = false,
        class: className = '',
        type = 'button',
        onclick = () => {}
    } = $props();
</script>

<button
    {type}
    {onclick}
    {disabled}
    class={twMerge("bg-blue-950 py-2 flex items-center justify-center rounded text-white", Icon && (iconRight ? 'pl-6 pr-4' : 'pl-4 pr-6'), (Icon && !label) && 'px-4', className, disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
>
    <div class="flex items-center gap-x-2">
        {#if !iconRight && Icon}
            <Icon class='min-w-4 max-w-4'/>
        {/if}
        
        {#if label}
            <TextS>{label}</TextS>
        {/if}
        
        {#if iconRight && Icon}
            <Icon class='min-w-4 max-w-4'/>
        {/if}
    </div>
</button>