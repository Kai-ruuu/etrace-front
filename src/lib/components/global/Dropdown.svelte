<script>
	import { twMerge } from "tailwind-merge";
	import TextS from "./TextS.svelte";

    let {
        value = $bindable(''),
        error = $bindable(''),
        label = null,
        labelLeft = false,
        onChange = (v) => {},
        children,
    } = $props();
</script>

<div class={twMerge("gap-x-2 flex items-center gap-y-1 my-2 scrollbar", !labelLeft && 'flex-col items-stretch')}>
    {#if label}
        <TextS class='text-gray-500'>{label}</TextS>
    {/if}
    <div class="flex items-center relative">
        <select
            bind:value={value}
            onchange={(e) => onChange(e.target.value)}
            class={twMerge("bg-gray-50 border border-gray-200 rounded w-full text-sm text-gray-700 py-3")}
        >
            {#if children}
                {@render children()}
            {/if}
        </select>
    </div>
    {#if error}
        <TextS class='text-red-500'>{error}</TextS>
    {/if}
</div>