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
    } = $props();

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
		formData.append('cv', upload);
		
		await postForm('/api/user/alumni/renew-cv', formData, {
			onSuccess: async (data) => {
				uploadOpen = false;
				URL.revokeObjectURL(uploadUrl);
				uploadUrl = null;
				upload = null;
				const input = document.getElementById('cv');
				if (input) input.value = '';

				user.set({
					...data,
					profile: {
						...data.profile,
					}
				});
				success('Curriculum Vitae has been revised.');
			},
			onFail: async (data) => error(data?.message ?? 'Unable to upload cv due to an error.')
		});
	}
</script>

<div class="flex items-center justify-between gap-x-4">
    <div class="flex flex-col">
        <TextS class='text-gray-500 mb-1'>Curriculum Vitae</TextS>
    
        <div class="flex items-center gap-x-4">
            <div class="bg-gray-100 border border-gray-200 w-8 h-8 rounded-sm flex items-center justify-center">
                <File class='w-4 text-gray-400'/>
            </div>
            <TextS class='max-w-full truncate'>{profile.profile.cv}</TextS>
        </div>
    </div>
    
    <div class="flex items-center gap-x-2">
        <ButtonM
            Icon={Eye}
            class='px-1 py-0'
            onclick={() => opened = true}
        />
        {#if editOn}
            <label for='cv'>
                <input
                    id='cv'
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
    </div>
</div>

<Modal
    bind:show={opened}
    heading="Viewing Current Curriculum Vitae"
    class='md:w-2/3 h-full space-y-2'
>
    <iframe
        frameborder="0"
        title={profile.profile.cv}
        src={apiUrl('/Uploads/alumni/cv/' + profile.profile.cv + '#toolbar=0&navpanes=0view=Fit')}
        class="scrollbar grow bg-white rounded-lg overflow-clip"
    >
    </iframe>
</Modal>

<Modal
    bind:show={uploadOpen}
    heading="Update Curriculum Vitae"
    class='md:w-2/3 h-full space-y-2'
    onExit={() => {
		URL.revokeObjectURL(uploadUrl);
		uploadUrl = null;
		upload = null;
        const input = document.getElementById('cv');

		if (input) input.value = '';
	}}
>
    <iframe
        frameborder="0"
        title={"Updated CV's Preview"}
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