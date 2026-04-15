<script>
	import { user } from "$lib/stores/user";
	import { getRoleDisplay } from "$lib/utils/ui";
	import { Shield, ShieldUser, User, UserCog } from "lucide-svelte";
	import TextM from "../global/TextM.svelte";
	import TextS from "../global/TextS.svelte";

    let {
        heading = ''
    } = $props();
</script>

<div class="border-b border-gray-200 px-6 min-h-16 flex items-center justify-between bg-white shrink-0">
    <TextM class='text-gray-600'>{heading}</TextM>
    <div class="flex items-center bg-blue-50 text-blue-900 p-2 rounded gap-x-2 pr-3">
        {#if ['company', 'alumni'].includes($user.role)}
            <User class='max-w-4'/>
        {:else}
            <ShieldUser class='max-w-4'/>
        {/if}
        <TextS>{getRoleDisplay($user)} {$user?.default && '(OIC)'}</TextS>
    </div>
</div>