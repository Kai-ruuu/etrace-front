<script>
	import { Eye, File, Upload } from "lucide-svelte";
	import TextS from "../global/TextS.svelte";
	import ButtonM from "../global/ButtonM.svelte";
	import Modal from "../global/modals/Modal.svelte";
	import { apiUrl, postForm } from "$lib/utils/api";
	import { error, success } from "$lib/utils/ui";
	import { user } from "$lib/stores/user";

    let { profile, editOn = false } = $props();

    let opened = $state(false);

    let upload = $state(null);
    let uploadUrl = $state(null);
    let uploadOpen = $state(false);

    const handleChange = (e) => {
        upload = e.target.files?.[0] ?? null;

        if (upload) {
            uploadUrl = URL.createObjectURL(upload);
            uploadOpen = true;
        } else {
            error('Something went wrong while adding the file.');
        }
    };

    async function onUploadUpdated() {
		let formData = new FormData();
		formData.append('logo', upload);
		
		await postForm('/api/user/company/renew-logo', formData, {
			onSuccess: async (data) => {
				uploadOpen = false;
				URL.revokeObjectURL(uploadUrl);
				uploadUrl = null;
				upload = null;
				const input = document.getElementById('logo');
				if (input) input.value = '';

				user.set({
					...data,
					profile: {
						...data.profile,
					}
				});
				success('Logo has been renewed.');
			},
			onFail: async (data) => error(data?.message ?? 'Unable to upload the updated logo due to an error.')
		});
	}
</script>

<div class="flex items-center justify-between gap-x-4">
    <div class="w-full flex flex-col items-stretch mb-2">
        <TextS class='text-gray-500 mb-1'>Logo</TextS>
        <div class="flex items-center gap-x-4">
            <div 
                style={`background-image: url(${apiUrl('/Uploads/company/logo/' + $user.profile.logo)})`}
                class="w-10 h-10 bg-contain bg-center rounded border border-gray-200"
            ></div>
            <div class="grow flex items-center justify-between">
                <TextS class='max-w-full truncate'>{$user.profile.logo}</TextS>
                <div class="flex items-center gap-x-2">
                    <ButtonM
                        Icon={Eye}
                        class='px-1 py-0'
                        onclick={() => opened = true}
                    />
                    {#if editOn}
                        <label for={'logo'}>
                            <input
                                id={'logo'}
                                type="file"
                                accept=".png,.jpg,.jpeg"
                                required={true}
                                onchange={handleChange}
                                class="hidden"
                            />
                            <div class="bg-blue-950 px-1 rounded cursor-pointer">
                                <Upload class='w-4 text-white'/>
                            </div>
                        </label>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<Modal
    bind:show={opened}
    heading='Viewing Current Logo'
    class='md:w-2/3 h-full space-y-2'
>
    <div class="h-full flex items-center justify-center">
        <div 
            style={`background-image: url(${apiUrl('/Uploads/company/logo/' + profile.profile['logo'])})`}
            class="min-w-32 min-h-32 max-w-32 max-h-32 md:min-w-64 md:min-h-64 md:max-w-64 md:max-h-64 bg-contain bg-center rounded-full border border-gray-200"
        ></div>
    </div>
</Modal>

<Modal
    bind:show={uploadOpen}
    heading='Logo Preview'
    class='md:w-2/3 h-full space-y-2'
    onExit={() => {
		URL.revokeObjectURL(uploadUrl);
		uploadUrl = null;
		upload = null;
        const input = document.getElementById('logo');

		if (input) input.value = '';
	}}
>
    <div class="grow flex items-center justify-center">
        <div 
            style={`background-image: url(${uploadUrl})`}
            class="min-w-32 min-h-32 max-w-32 max-h-32 md:min-w-64 md:min-h-64 md:max-w-64 md:max-h-64 bg-contain bg-center rounded-full border border-gray-200"
        ></div>
    </div>
    <ButtonM
        Icon={Upload}
        label='Update'
        onclick={onUploadUpdated}
    />
</Modal>