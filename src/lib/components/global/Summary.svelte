<script>
	import { Info, User } from "lucide-svelte";
	import TextX from "./TextX.svelte";
	import TextM from "./TextM.svelte";
	import { formatNumber } from "$lib/utils/ui";
	import { twMerge } from "tailwind-merge";
	import RoundedCard from "./RoundedCard.svelte";

    let {
        label,
        total,
        active,
        inactive,
        Icon = null,
        class: className = ''
    } = $props();
</script>

<RoundedCard class={twMerge('p-4 border border-blue-300 bg-blue-50', className)}>
    <div class="flex items-center gap-x-2">
        <TextX>{label.toUpperCase()}</TextX>
        <Info class='w-4 text-gray-400'/>
    </div>
    <div class="mt-1 flex items-center gap-x-2">
        <div class="bg-gray-100 w-8 h-8 rounded flex items-center justify-center">
            {#if Icon}
                <Icon class='w-5 text-gray-500'/>
            {:else}
                <User class='w-5 text-gray-500'/>
            {/if}
        </div>
        <TextM class='font-semibold'>{formatNumber(total)}</TextM>
    </div>
    <div class="mt-3 grid grid-cols-2 gap-x-4">
        <div class="flex flex-col border border-green-200 bg-green-50 rounded p-2">
            <TextX class='text-green-500'>{formatNumber(active)} Active</TextX>
        </div>
        <div class="flex flex-col border border-red-100 bg-red-50 rounded p-2">
            <TextX class='text-red-500'>{formatNumber(inactive)} Inactive</TextX>
        </div>
    </div>
</RoundedCard>