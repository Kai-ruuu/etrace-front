<script>
	import TextS from "./TextS.svelte";

    let {
        label,
        children
    } = $props();
</script>
<div class="w-full space-y-2">
    <TextS class='px-2 text-gray-500'>{label}</TextS>
    <div class="w-full flex flex-col items-stretch">
        {@render children()}
    </div>
</div>