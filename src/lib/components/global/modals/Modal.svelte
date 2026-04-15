<script>
	import { Check, X } from "lucide-svelte";
	import ButtonM from "../ButtonM.svelte";
	import RoundedCard from "../RoundedCard.svelte";
	import TextM from "../TextM.svelte";
	import TextS from "../TextS.svelte";
	import { twMerge } from "tailwind-merge";

    let {
        show = $bindable(false),
        heading = 'Modal Heading',
        class: className = '',
        overflow = false,
        children
    } = $props();
</script>

{#if show}
    <div class={twMerge(
        "fixed w-screen h-dvh bg-gray-300/50 p-8 inset-0 z-100",
        overflow ? 'overflow-auto scrollbar' : 'flex items-center justify-center'
    )}>
        <RoundedCard class={twMerge('flex flex-col items-stretch w-full md:w-1/3 gap-y-4 mx-auto', className)}>
            <div class="flex items-center justify-between bg-white">
                <TextM>{heading}</TextM>
                <ButtonM
                    Icon={X}
                    onclick={() => show = false}
                    class='p-0 px-1 bg-red-500'
                />
            </div>
            {#if children}
                {@render children()}
            {/if}
        </RoundedCard>
    </div>
{/if}