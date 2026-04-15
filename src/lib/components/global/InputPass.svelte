<script>
	import { Eye, EyeClosed, Lock } from "lucide-svelte";
	import TextS from "./TextS.svelte";
	import { twMerge } from "tailwind-merge";

    let {
        value = $bindable(''),
        error = $bindable(''),
        label = null,
        placeholder = '',
        minLength = 8,
        maxLength = 65,
        required = true,
        onInput = (v) => {},
        showIcon = true,
    } = $props();

    let show = $state(false);
</script>

<div class="flex flex-col items-stretch gap-y-1 my-2">
    {#if label}
        <TextS class='text-gray-500'>{label}</TextS>
    {/if}
    <div class="flex items-center relative">
        {#if showIcon}
            <Lock class='min-w-4 max-w-4 absolute left-3 text-gray-600'/>
        {/if}

        <input
            bind:value={value}
            placeholder={placeholder}
            minlength={minLength}
            maxlength={maxLength}
            required={required}
            oninput={(e) => onInput(e.target.value)}
            type={show ? "text" : 'password'}
            class={twMerge("bg-gray-50 border border-gray-200 rounded w-full text-sm py-3", showIcon && 'indent-6')}
        >
        <button
            type="button"
            onclick={() => show = !show}
            class="cursor-pointer text-gray-500 absolute right-3"
        >
            {#if show}
                <Eye class='min-w-4 max-w-4'/>
            {:else}
                <EyeClosed class='min-w-4 max-w-4'/>
            {/if}
        </button>
    </div>
    {#if error}
        <TextS class='text-red-500'>{error}</TextS>
    {/if}
</div>