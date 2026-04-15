<script>
	import { X } from "lucide-svelte";
	import TextS from "./TextS.svelte";
	import { twMerge } from "tailwind-merge";

    let {
        value = $bindable(''),
        error = $bindable(''),
        label = null,
        placeholder = '',
        required = true,
        minLength = null,
        maxLength = null,
        onInput = (v) => {},
        class: className = ''
    } = $props();
</script>

<div class={twMerge("flex flex-col items-stretch gap-y-1 my-2", className)}>
    {#if label}
        <TextS class='text-gray-500'>{label}</TextS>
    {/if}

    <div class="flex items-stretch gap-x-2">
        <div class="flex items-center relative grow">
            <textarea
                bind:value={value}
                placeholder={placeholder}
                minlength={minLength}
                maxlength={maxLength}
                required={required}
                oninput={(e) => onInput(e.target.value)}
                class={twMerge("grow bg-gray-50 border border-gray-200 w-full text-sm py-3 rounded")}
            ></textarea>
        </div>
    </div>

    {#if error}
        <TextS class='text-red-500'>{error}</TextS>
    {/if}
</div>