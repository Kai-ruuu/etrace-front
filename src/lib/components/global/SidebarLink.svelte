<script>
    import { goto } from "$app/navigation";
    import { twMerge } from "tailwind-merge";
    import TextS from "./TextS.svelte";
    import { page } from "$app/state";
	import { sidebarShown } from "$lib/stores/sidebar";

    let { Icon, label, path, desktop = false } = $props();

    const isActive = $derived.by(() => {
        const current = page.url.pathname;
        const normalize = (p) => p.replace(/\/$/, '') || '/';
        return normalize(current) === normalize(path);
    });
</script>

<button
    onclick={() => {
        sidebarShown.set(desktop);
        goto(path, { replaceState: true });
    }}
    class={twMerge(
        "flex items-center gap-x-2 cursor-pointer rounded p-2",
        isActive && 'bg-blue-50 text-blue-900'
    )}
>
    <Icon class='w-4'/>
    <TextS>{label}</TextS>
</button>