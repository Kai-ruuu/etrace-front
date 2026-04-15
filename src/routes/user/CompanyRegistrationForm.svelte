<script>
	import BaseContainer from "$lib/components/global/BaseContainer.svelte";
	import RoundedCard from "$lib/components/global/RoundedCard.svelte";

</script>

<BaseContainer withBgImage={true} class="animate-bg">
    <div class="bg-white/50 w-full h-full flex items-center justify-center">
        <RoundedCard class="p-8 pb-6 md:w-2/5 rounded-xl flex flex-col gap-y-5">
        </RoundedCard>
    </div>
</BaseContainer>