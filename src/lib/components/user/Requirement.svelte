<script>
	import { Eye, File, Upload } from "lucide-svelte";
	import TextS from "../global/TextS.svelte";
	import ButtonM from "../global/ButtonM.svelte";
	import Modal from "../global/modals/Modal.svelte";
	import { apiUrl, postForm } from "$lib/utils/api";
	import { error, success } from "$lib/utils/ui";
	import { user } from "$lib/stores/user";

    let {
        profile,
        editOn = false,
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

    let status = $derived(profile.profile['stat_' + reqKey]);
    let opened = $state(false);

    let upload = $state(null);
    let uploadUrl = $state(null);
    let uploadOpen = $state(false);

    async function onUploadUpdated() {
		let formData = new FormData();
		formData.append('requirement_key', reqKey);
		formData.append('requirement', upload);
		
		await postForm('/api/user/company/revise-requirement', formData, {
			onSuccess: async (data) => {
				uploadOpen = false;
				URL.revokeObjectURL(uploadUrl);
				uploadUrl = null;
				upload = null;
				const input = document.getElementById(reqKey);
				if (input) input.value = '';

				user.set({
					...data,
					profile: {
						...data.profile,
					}
				});
				success('Requirement has been revised.');
			},
			onFail: async (data) => error(data?.message ?? 'Unable to upload the updated version due to an error.')
		});
	}
</script>

<div class="flex items-center justify-between gap-x-4">
    <div class="flex items-center gap-x-4">
        <div class="bg-gray-100 border border-gray-200 w-8 h-8 rounded-sm flex items-center justify-center">
            <File class='w-4 text-gray-400'/>
        </div>
        <TextS class='max-w-full truncate'>{reqDisplay}</TextS>
    </div>
    
    <div class="flex items-center gap-x-2">
        <div>
            {#if status === 'Approved'}
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">Approved</span>
            {:else if status === 'Pending'}
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-600">Pending</span>
            {:else}
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-600">For Revision</span>
            {/if}
        </div>
        <ButtonM
            Icon={Eye}
            class='px-1 py-0'
            onclick={() => opened = true}
        />
        {#if editOn}
            {#if profile.profile['stat_' + reqKey] === 'Pending'}
                <ButtonM
                    Icon={Upload}
                    class='px-1 py-0 opacity-75'
                    disabled={true}
                />
            {:else}
                <label for={reqKey}>
                    <input
                        id={reqKey}
                        type="file"
                        accept=".pdf"
                        required={true}
                        onchange={handleChange}
                        class="hidden"
                    />
                    <div class="bg-blue-950 px-1 rounded cursor-pointer">
                        <Upload class='w-4 text-white'/>
                    </div>
                </label>
            {/if}
        {/if}
    </div>
</div>

<Modal
    bind:show={opened}
    heading={reqDisplay}
    class='md:w-2/3 h-full space-y-2'
>
    <iframe
        frameborder="0"
        title={reqDisplay}
        src={apiUrl('/Uploads/company/' + folderKey + '/' + profile.profile[reqKey] + '#toolbar=0&navpanes=0view=Fit')}
        class="scrollbar grow bg-white rounded-lg overflow-clip"
    >
    </iframe>
</Modal>

<Modal
    bind:show={uploadOpen}
    heading={reqDisplay}
    class='md:w-2/3 h-full space-y-2'
    onExit={() => {
		URL.revokeObjectURL(uploadUrl);
		uploadUrl = null;
		upload = null;
        const input = document.getElementById(reqKey);

		if (input) input.value = '';
	}}
>
    <iframe
        frameborder="0"
        title={reqDisplay}
        src={uploadUrl + '#toolbar=0&navpanes=0view=Fit'}
        class="scrollbar grow bg-white rounded-lg overflow-clip"
    >
    </iframe>
    <ButtonM
        Icon={Upload}
        label='Update'
        onclick={onUploadUpdated}
    />
</Modal>