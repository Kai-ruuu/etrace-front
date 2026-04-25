<script>
	import { user } from "$lib/stores/user";
	import { getRoleDisplay } from "$lib/utils/ui";
	import { GraduationCap, Search, Shield, ShieldUser, User, UserCog } from "lucide-svelte";
	import TextM from "../global/TextM.svelte";
	import TextS from "../global/TextS.svelte";
	import TextX from "../global/TextX.svelte";
	import InputText from "../global/InputText.svelte";

    let {
        heading = '',
        query = $bindable(''),
        onSearch,
        forVercent = false
    } = $props();
</script>

<div class="border-b border-gray-200 px-4 min-h-16 grid grid-cols-16 bg-white shrink-0 gap-4">
    <div class="min-h-16 flex items-center bg-white gap-x-3 col-span-4">
        <div class="flex items-center justify-center min-w-8 min-h-8 bg-blue-50 border border-blue-100 rounded">
            <GraduationCap class='min-w-6 text-blue-900'/>
        </div>
        <div>
            <TextM class='font-bold text-blue-900'>E-trace+</TextM>
            <TextX class='text-gray-500'>Tracking Careers. Empowering Connections.</TextX>
        </div>
    </div>

    <div class="col-span-8">
        {#if !forVercent}
            <InputText
                bind:value={query}
                placeholder='Search job posts'
                Icon={Search}
                btnLabel='Search'
                BtnIcon={Search}
                onBtnClick={onSearch}
                allowClear={true}
                onClear={onSearch}
            />
        {/if}
    </div>
    
    <div class="col-span-4 flex items-center justify-end">
        <div class="flex items-center bg-blue-50 text-blue-900 p-2 rounded gap-x-2 pr-3">
            <User class='max-w-4'/>
            <TextS>{getRoleDisplay($user)} {$user?.default && '(OIC)'}</TextS>
        </div>
    </div>
</div>