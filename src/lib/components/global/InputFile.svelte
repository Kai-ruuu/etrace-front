<script>
    import { Paperclip, Upload } from "lucide-svelte";
    import TextS from "./TextS.svelte";
	import { twMerge } from "tailwind-merge";

    let {
        value = $bindable(null),
        error = $bindable(''),
        label = null,
        placeholder = 'Choose a file',
        required = true,
        accept = [],
        onChange = (v) => {}
    } = $props();

    const acceptString = $derived(accept.length ? accept.join(',') : undefined);

    const handleChange = (e) => {
        const file = e.target.files?.[0] ?? null;
        value = file;
        onChange(file);
    };
</script>

<div class="flex flex-col items-stretch gap-y-1 my-2">
    {#if label}
        <TextS class='text-gray-500'>{label}</TextS>
    {/if}
    <div class="flex items-center relative">
        <label class="bg-gray-100 border border-gray-200 rounded w-full indent-3 text-sm py-3 flex items-center">
            <input
                type="file"
                accept={acceptString}
                required={required}
                onchange={handleChange}
                class="hidden"
            />
            <span class={value ? 'text-gray-800' : 'text-gray-400'}>
                {value ? value.name : placeholder}
            </span>
            <div class="absolute right-4 bg-blue-900 px-1 rounded cursor-pointer">
                <Upload class='w-4 text-white'/>
            </div>
        </label>
    </div>
    {#if error}
        <TextS class='text-red-500'>{error}</TextS>
    {/if}
</div>