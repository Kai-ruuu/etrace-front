<script>
	import { twMerge } from "tailwind-merge";

    let {
        children,
        class: className = ''
    } = $props();
</script>

<div class={twMerge("p-6 bg-white rounded-lg border border-gray-200", className)}>
    {#if children}
        {@render children()}
    {/if}
</div>