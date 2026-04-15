<script>
	import { user } from "$lib/stores/user";
	import { getRoleDisplay } from "$lib/utils/ui";
	import { Shield, ShieldUser, User, UserCog } from "lucide-svelte";
	import TextM from "../global/TextM.svelte";
	import TextS from "../global/TextS.svelte";

    let {
        exporting = $bindable(false),
        onExport = () => {}
    } = $props();
</script>

<div class="border-b border-gray-200 px-6 min-h-16 flex items-center justify-between bg-white shrink-0">
    <TextM class='text-gray-600'>Dashboard</TextM>

    <button 
        onclick={onExport}
        disabled={exporting}
        class="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
    >
        {#if exporting}
        <span>Generating PDF...</span>
        {:else}
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        Export PDF Report
        {/if}
    </button>
</div>