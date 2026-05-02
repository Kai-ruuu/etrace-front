<script>
	import { Check, X } from "lucide-svelte";
	import ButtonM from "../ButtonM.svelte";
	import RoundedCard from "../RoundedCard.svelte";
	import TextM from "../TextM.svelte";
	import TextS from "../TextS.svelte";
	import { twMerge } from "tailwind-merge";

    let {
        show = $bindable(false),
        heading = 'Confirmation',
        text = 'Confirm?',
        onConfirm = () => {},
        class: className = ''
    } = $props();
</script>

{#if show}
    <div class="fixed w-screen h-dvh bg-gray-300/50 p-8 flex items-center justify-center inset-0 z-100">
        <RoundedCard class={twMerge(
            "flex flex-col items-stretch w-full md:w-1/4 gap-y-4",
            className
        )}>
            <div class="flex items-center justify-between">
                <TextM>{heading}</TextM>
                <ButtonM
                    Icon={X}
                    onclick={() => show = false}
                    class='p-0 px-1 bg-red-500'
                />
            </div>
            <TextS class='text-justify'>{text}</TextS>
            <ButtonM Icon={Check} label='Confirm' onclick={onConfirm}/>
        </RoundedCard>
    </div>
{/if}