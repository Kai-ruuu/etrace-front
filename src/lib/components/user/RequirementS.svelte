<script>
	import { File, ShowerHead, X } from "lucide-svelte";
	import Modal from "../global/modals/Modal.svelte";
	import TextS from "../global/TextS.svelte";
	import { apiUrl } from "$lib/utils/api";

    let {
        profile,
        reqKey,
        reqDisplay,
    } = $props();

    let folderKey = $derived({
        req_company_profile: 'profile',
        req_business_permit: 'permit',
        req_sec: 'sec',
        req_dti_cda: 'dti',
        req_reg_of_est: 'reg_est',
        req_cert_from_dole: 'cert_dole',
        req_cert_no_case: 'cert_npc',
        req_philjobnet_reg: 'reg_pjn',
        req_list_of_vacancies: 'lov',
    }[reqKey]);

    let opened = $state(false);
</script>

<div class="flex items-center justify-between gap-y-1">
    <div class="flex items-center gap-x-3">
        <div class="bg-gray-100 border border-gray-200 w-8 h-8 rounded-sm flex items-center justify-center">
            <File class='w-4 text-gray-400'/>
        </div>
        <TextS>{reqDisplay}</TextS>
    </div>
    {#if !opened}
        <button
            Icon={X}
            label='Close'
            onclick={() => opened = true}
            class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-blue-100 text-blue-500 hover:bg-blue-50"
        >
            View
        </button>
    {/if}
</div>

<Modal
    bind:show={opened}
    heading={reqDisplay}
    class='md:w-2/3 h-full'
>
    <iframe
        frameborder="0"
        title={reqDisplay}
        src={apiUrl('/Uploads/company/' + folderKey + '/' + profile.profile[reqKey] + '#toolbar=0&navpanes=0view=Fit')}
        class="scrollbar grow bg-white rounded-lg overflow-clip"
    >
    </iframe>
</Modal>