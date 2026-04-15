<script>
	import { X } from "lucide-svelte";
	import TextS from "./TextS.svelte";
	import { twMerge } from "tailwind-merge";

    let {
        value = $bindable(''),
        error = $bindable(''),
        label = null,
        placeholder = '',
        Icon =  null,
        required = true,
        min = null,
        max = null,
        BtnIcon = null,
        onInput = () => {},
        class: className = ''
    } = $props();
</script>

<div class={twMerge("flex flex-col items-stretch gap-y-1 my-2", className)}>
    {#if label}
        <TextS class='text-gray-500'>{label}</TextS>
    {/if}

    <div class="flex items-stretch gap-x-2">
        <div class="flex items-center relative grow">
            {#if Icon}
                <Icon class='min-w-4 max-w-4 absolute left-3 text-gray-600'/>
            {/if}
            
            <input
                bind:value={value}
                placeholder={placeholder}
                {min}
                {max}
                required={required}
                oninput={(e) => onInput(e.target.value)}
                type="number"
                class={twMerge("grow bg-gray-50 border border-gray-200 w-full text-sm py-3 rounded", Icon && 'indent-6')}
            >
        </div>
    </div>

    {#if error}
        <TextS class='text-red-500'>{error}</TextS>
    {/if}
</div>