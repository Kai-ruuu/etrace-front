<script>
	import { twMerge } from "tailwind-merge";

    let {
        children,
        class: className = ''
    } = $props();
</script>

<p class={twMerge('text-md', className)}>
    {#if children}
        {@render children()}
    {/if}
</p>