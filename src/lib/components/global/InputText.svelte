<script>
	import { X } from "lucide-svelte";
	import TextS from "./TextS.svelte";
	import { twMerge } from "tailwind-merge";
	import { readonly } from "svelte/store";

    let {
        value = $bindable(''),
        error = $bindable(''),
        label = null,
        placeholder = '',
        Icon =  null,
        required = true,
        minLength = null,
        maxLength = null,
        allowClear = false,
        BtnIcon = null,
        btnLabel = null,
        onBtnClick = () => {},
        onInput = (v) => {},
        onClear = () => {},
        list = null,
        readOnly = false,
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
                {list}
                bind:value={value}
                readonly={readOnly}
                placeholder={placeholder}
                minlength={minLength}
                maxlength={maxLength}
                required={required}
                oninput={(e) => onInput(e.target.value)}
                type="text"
                class={twMerge("grow bg-gray-50 border border-gray-200 w-full text-sm py-3 rounded", Icon && 'indent-6')}
            >
    
            {#if allowClear && value}
                <button
                    type="button"
                    onclick={async () => {
                        value = '';
    
                        await onClear();
                    }}
                    class="cursor-pointer text-gray-500 absolute right-3"
                >
                    <X class='min-w-4 max-w-4'/>
                </button>
            {/if}
        </div>

        {#if BtnIcon || btnLabel}
            <button
                onclick={onBtnClick}
                class={twMerge("text-white cursor-pointer bg-blue-900 flex items-center gap-x-2 pl-3 pr-4 rounded")}
            >
                {#if BtnIcon}
                    <BtnIcon class='w-4'/>
                {/if}
                {#if btnLabel}
                    <TextS>{btnLabel}</TextS>
                {/if}
            </button>
        {/if}
    </div>

    {#if error}
        <TextS class='text-red-500'>{error}</TextS>
    {/if}
</div>