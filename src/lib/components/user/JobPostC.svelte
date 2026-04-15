<script>
	import { apiUrl, deleteJson, patchJson, postJson } from "$lib/utils/api";
	import { Book, Briefcase, Calendar, Check, CheckCircle, ChevronDown, ChevronRight, CircleDollarSign, File, Info, MapPin, Monitor, Plus, Scroll, SunMoon, ThumbsUp, Trash, Upload, UserSearch, X } from "lucide-svelte";
	import RoundedCard from "../global/RoundedCard.svelte";
	import TextM from "../global/TextM.svelte";
	import TextX from "../global/TextX.svelte";
	import TextS from "../global/TextS.svelte";
	import { error, formatDate, formatNumber, success, successAsync } from "$lib/utils/ui";
	import ButtonM from "../global/ButtonM.svelte";
	import ConfirmModal from "../global/modals/ConfirmModal.svelte";
	import { onMount } from "svelte";
	import Modal from "../global/modals/Modal.svelte";
	import InputText from "../global/InputText.svelte";
	import InputTextArea from "../global/InputTextArea.svelte";
	import InputNumber from "../global/InputNumber.svelte";
	import Dropdown from "../global/Dropdown.svelte";
	import DropdownItem from "../global/DropdownItem.svelte";
	import { twMerge } from "tailwind-merge";

    let { post, onSearch, openFilter, courses, onViewSubmissions, onChangesSaved } = $props();
    let confirmClose = $state(false);
    let confirmRepost = $state(false);
    let confirmDelete = $state(false);
    let openFullView = $state(false);
    let openUntil = $state({ value: null, error: '' });
    let openEditModal = $state(false);

    let newPost = $state({
		position: { value: '', error: '' },
		address: { value: '', error: '' },
		slots: { value: 0, error: '' },
		salaryMin: { value: 0, error: '' },
		salaryMax: { value: 0, error: '' },
		workEmploymentType: { value: 'Full-time', error: '' },
		workSetup: { value: 'On-site', error: '' },
		workShift: { value: 'Day', error: '' },
		description: { value: '', error: '' },
		qualifications: { value: [], error: '' },
		additionalInfo: { value: null, error: '' },
		targetCourses: { value: [], error: ''},
	});
    let newQuali = $state({ value: '', error: '' });

    async function onClose() {
        await patchJson('/api/job-post/close/' + post.id, null, {
            onSuccess: async (data) => {
                await onSearch();
                success('Job post has been closed.');
            },
            onFail: async (err) => error(err?.message ?? 'Unable to close job post due to an error.')
        });
    }

    async function onDelete() {
        await deleteJson('/api/job-post/' + post.id, null, {
            onSuccess: async (data) => {
                await onSearch();
                success('Job post has been deleted.');
            },
            onFail: async (err) => error(err?.message ?? 'Unable to delete job post due to an error.')
        });
    }

    async function onRepost() {
        openUntil.error = '';

        if (new Date(openUntil.value) <= new Date())
            openUntil.error = 'Open until date should not be from the past or today.';
        
        if (
            !openUntil.value ||
            openUntil.error
        ) {
            error('Cannot repost job post yet.');
            return;
        }
        
        await patchJson('/api/job-post/repost/' + post.id,
            { open_until: openUntil.value },
            {
                onSuccess: async (data) => {
                    await onSearch();
                    success('Job post has been reposted.');
                },
                onFail: async (err) => error(err?.message ?? 'Unable to repost job post due to a error.')
            }
        );
    }

    async function onAddQuali() {
        if (
            !newQuali.value.trim() ||
            newQuali.error
        ) {
            error("Cannot add qualification yet.");
            return;
        }

        await postJson('/api/qualification/' + post.id,
            { qualification: newQuali.value },
            {
                onSuccess: async (_data) => {
                    newPost.qualifications.value = [...newPost.qualifications.value, _data];
                    newQuali.value = '';
                },
                onFail: async (err) => error(err?.message ?? "Unable to add qualification due to an error.")
            }
        );
    }

    async function onRemoveQuali(id) {
        if (newPost.qualifications.value.length - 1 <= 0) {
            error('Job post should have at least one qualification.');
            return;
        }
        
        await deleteJson('/api/qualification/' + id, null,
            {
                onSuccess: async (_data) => newPost.qualifications.value = [...newPost.qualifications.value.filter((q) => q.id !== id)],
                onFail: async (err) => error(err?.message ?? "Unable to remove qualification due to an error.")
            }
        );
    }

    async function onAddTargetCourse(courseId) {
        await postJson(`/api/target-course/${post.id}/${courseId}`, null, {
            onSuccess: async (_data) => newPost.targetCourses.value = [...newPost.targetCourses.value, _data],
            onFail: async (err) => error(err?.message ?? 'Unable target course due to an error.')
        });
    }

    async function onRemoveTargetCourse(id) {
        await deleteJson(`/api/target-course/${id}`, null, {
            onSuccess: async (_data) => newPost.targetCourses.value = [...newPost.targetCourses.value.filter((tc) => tc.id !== id)],
            onFail: async (err) => error(err?.message ?? 'Unable to remove course from target courses due to an error.')
        });
    }

    async function onUpdate() {
        if (!newPost.position.value.trim())
			newPost.position.error = 'Position is required.';

		if (!newPost.description.value.trim())
			newPost.description.error = 'Description is required.';

		if (newPost.targetCourses.value.length === 0)
			newPost.targetCourses.error = 'Job post should have at least one target course.';

		if (newPost.qualifications.value.length === 0)
			newPost.qualifications.error = 'Job post should have at least one qualification.';

		if (String(newPost.slots.value).length === 0)
			newPost.slots.error = 'Slots are required.';
		else if (newPost.slots.value <= 0)
			newPost.slots.error = 'Should not be less than or equal to zero.';

		if (String(newPost.salaryMin.value).length === 0)
			newPost.salaryMin.error = 'Slots are required.';
		else if (newPost.salaryMin.value <= 0)
			newPost.salaryMin.error = 'Should not be less than or equal to zero.';
		else if (newPost.salaryMin.value > newPost.salaryMax.value)
			newPost.salaryMin.error = 'Should not be greater than the maximum salary.';

		if (String(newPost.salaryMax.value).length === 0)
			newPost.salaryMax.error = 'Slots are required.';
		else if (newPost.salaryMax.value <= 0)
			newPost.salaryMax.error = 'Should not be less than or equal to zero.';
		else if (newPost.salaryMax.value < newPost.salaryMin.value)
			newPost.salaryMax.error = 'Should not be less than the minimum salary.';
			
		if (
			newPost.position.error ||
			newPost.address.error ||
			newPost.slots.error ||
			newPost.salaryMin.error ||
			newPost.salaryMax.error ||
			newPost.workEmploymentType.error ||
			newPost.workSetup.error ||
			newPost.workShift.error ||
			newPost.description.error ||
			newPost.qualifications.error ||
			newPost.additionalInfo.error ||
			newPost.targetCourses.error
		) {
			error('Cannot save changes yet.');
			return;
		}

        await patchJson('/api/job-post/' + post.id,
			{
				position: newPost.position.value,
				address: newPost.address.value,
				slots: newPost.slots.value,
				salary_min: newPost.salaryMin.value,
				salary_max: newPost.salaryMax.value,
				work_employment_type: newPost.workEmploymentType.value,
				work_setup: newPost.workSetup.value,
				work_shift: newPost.workShift.value,
				description: newPost.description.value,
				additional_info: newPost.additionalInfo.value,
			},
			{
				onSuccess: async (_) => {
                    openEditModal = false;
                    onSearch();
                    onChangesSaved();
				},
				onFail: async (err) => error(err?.message ?? 'Unable to save changes due to error.')
			}
		);
    }

    onMount(() => {
        const defaultOpenUntil = new Date();
        defaultOpenUntil.setDate(defaultOpenUntil.getDate() + 30);
        openUntil.value = defaultOpenUntil.toISOString().split('T')[0];

        newPost.position.value = post.position;
        newPost.address.value = post.address;
        newPost.slots.value = post.slots;
        newPost.salaryMin.value = post.salary_min;
        newPost.salaryMax.value = post.salary_max;
        newPost.workEmploymentType.value = post.work_employment_type;
        newPost.workSetup.value = post.work_setup;
        newPost.workShift.value = post.work_shift;
        newPost.description.value = post.description;
        newPost.qualifications.value = post.qualifications;
        newPost.additionalInfo.value = post.additional_info;
        newPost.targetCourses.value = post.target_courses;
    })
</script>

<RoundedCard class='space-y-4 rounded'>
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-x-3">
            <div 
                style={`background-image: url(${apiUrl('/Uploads/company/logo/' + post.company.logo)})`}
                class="w-8 h-8 bg-cover bg-center rounded-full border border-gray-200"
            ></div>
            <div class="flex flex-col">
                <TextM class='max-w-full truncate'>{post.company.name}</TextM>
                <TextX>{formatDate(post.created_at)}</TextX>
            </div>
        </div>
        <div class="flex items-center gap-x-2">
            {#if !openFilter}
                <button
                    onclick={() => openEditModal = true}
                    class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-blue-100 text-blue-500 hover:bg-blue-50"
                >
                    Edit
                </button>
            {/if}
            {#if openFilter}
                <button
                    onclick={() => confirmClose = true}
                    class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-red-100 text-red-500 hover:bg-red-50"
                >
                    Close
                </button>
            {:else}
                <button
                    onclick={() => confirmRepost = true}
                    class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-green-100 text-green-500 hover:bg-green-50"
                >
                    Repost
                </button>
                <button
                    onclick={() => confirmDelete = true}
                    class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-red-100 text-red-500 hover:bg-red-50"
                >
                    Delete
                </button>
            {/if}
        </div>
    </div>

    <div class="flex flex-col items-stretch gap-y-1">
        <TextS class='py-2 font-bold text-gray-700/80'>Looking for {post.position} ({post.slots} {post.slots > 1 ? 'slots' : 'slot'})</TextS>

        <div class="flex items-center gap-x-2">
            <div class="flex items-center gap-x-2 bg-green-50 text-green-900 px-2 py-1 rounded">
                <Scroll class='w-4'/>
                <TextS>{post.work_employment_type}</TextS>
            </div>
            <div class="flex items-center gap-x-2 bg-yellow-50 text-yellow-900 px-2 py-1 rounded">
                <SunMoon class='w-4'/>
                <TextS>{post.work_shift}</TextS>
            </div>
            <div class="flex items-center gap-x-2 bg-blue-50 text-blue-900 px-2 py-1 rounded">
                <Monitor class='w-4'/>
                <TextS>{post.work_setup}</TextS>
            </div>
        </div>
    
        <div class="flex items-center gap-x-3">
            <Briefcase class='w-4 text-gray-500'/>
            <TextS>{post.position}</TextS>
        </div>
        <div class="flex items-center gap-x-3">
            <CircleDollarSign class='w-4 text-gray-500'/>
            <TextS>₱{formatNumber(post.salary_min)} - ₱{formatNumber(post.salary_max)}</TextS>
        </div>
        <div class="flex items-center gap-x-3">
            <MapPin class='w-4 text-gray-500'/>
            <TextS>{post.address}</TextS>
        </div>
        {#if openFilter}
            <div class="flex items-center gap-x-3">
                <Calendar class='w-4 text-gray-500'/>
                <TextS>Open until: {formatDate(post.open_until)}</TextS>
            </div>
        {/if}
    </div>

    <div class="flex flex-col items-stretch">
        <div class="flex flex-col items-stretch gap-y-4">
            <div class="flex items-center gap-x-2">
                <div class="flex items-center gap-x-2">
                    <ThumbsUp class='w-4 text-gray-500'/>
                    <TextS>{
                        post.likes >= 1000
                            ? post.likes + 'k'
                            : post.likes >= 1000000
                                ? post.likes + 'm'
                                : post.likes
                    } {post.likes > 1 || post.likes === 0 ? 'Likes' : 'Like'}</TextS>
                </div>
                <div class="flex items-center gap-x-2">
                    <Upload class='w-4 text-gray-500'/>
                    <TextS>{
                        post.submissions >= 1000
                            ? post.submissions + 'k'
                            : post.submissions >= 1000000
                                ? post.submissions + 'm'
                                : post.submissions
                    } {post.submissions > 1 || post.submissions === 0 ? 'Submissions' : 'Submission'}</TextS>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-x-4">
                <ButtonM
                    Icon={Info}
                    label='More Information'
                    onclick={() => openFullView = true}
                    class='px-4 bg-transparent text-blue-950 border border-blue-950'
                />
                <ButtonM
                    Icon={File}
                    disabled={post.submissions <= 0}
                    label='View Submissions'
                    onclick={async () => await onViewSubmissions(post.id)}
                    class={twMerge('px-4', post.submissions <= 0 && 'opacity-80')}
                />
            </div>
        </div>
    </div>
</RoundedCard>

{#if openFullView}
    <div class="fixed w-screen h-dvh bg-gray-300/50 p-8 inset-0 z-100 overflow-auto scrollbar">
        <RoundedCard class='flex flex-col items-stretch w-full md:w-2/3 gap-y-4 mx-auto p-0'>
            <div class="flex items-center justify-between border-b border-gray-100 p-4">
                <div class="flex items-center gap-x-3">
                    <div 
                        style={`background-image: url(${apiUrl('/Uploads/company/logo/' + post.company.logo)})`}
                        class="w-8 h-8 bg-cover bg-center rounded-full border border-gray-200"
                    ></div>
                    <div class="flex flex-col">
                        <TextM class='max-w-full truncate'>{post.company.name}</TextM>
                        <TextX>{formatDate(post.created_at)}</TextX>
                    </div>
                </div>

                <div class="flex items-center gap-x-2">
                    <ButtonM
                        Icon={X}
                        onclick={() => openFullView = false}
                        class='bg-red-500 px-1 py-0'
                    />
                </div>
            </div>

            <div class="flex flex-col items-stretch gap-y-1 px-4">
                <TextS class='py-2 font-bold text-gray-700/80'>Looking for {post.position} ({post.slots} {post.slots > 1 ? 'slots' : 'slot'})</TextS>

                <div class="flex items-center gap-x-2">
                    <div class="flex items-center gap-x-2 bg-green-50 text-green-900 px-2 py-1 rounded">
                        <Scroll class='w-4'/>
                        <TextS>{post.work_employment_type}</TextS>
                    </div>
                    <div class="flex items-center gap-x-2 bg-yellow-50 text-yellow-900 px-2 py-1 rounded">
                        <SunMoon class='w-4'/>
                        <TextS>{post.work_shift}</TextS>
                    </div>
                    <div class="flex items-center gap-x-2 bg-blue-50 text-blue-900 px-2 py-1 rounded">
                        <Monitor class='w-4'/>
                        <TextS>{post.work_setup}</TextS>
                    </div>
                </div>
                
                <div class="flex items-center gap-x-3">
                    <CircleDollarSign class='w-4 text-gray-500'/>
                    <TextS>₱{formatNumber(post.salary_min)} - ₱{formatNumber(post.salary_max)}</TextS>
                </div>
                <div class="flex items-center gap-x-3">
                    <MapPin class='w-4 text-gray-500'/>
                    <TextS>{post.address}</TextS>
                </div>
                {#if openFilter}
                    <div class="flex items-center gap-x-3">
                        <Calendar class='w-4 text-gray-500'/>
                        <TextS>Open until: {formatDate(post.open_until)}</TextS>
                    </div>
                {/if}
            </div>

            <div class="flex flex-col items-stretch gap-y-2 border-t border-gray-100 pt-4 px-4">
                <TextX class='text-gray-700/80 font-bold'>Description:</TextX>
                <div>
                    <TextS class='text-justify'>{post.description}</TextS>
                </div>
            </div>

            <div class="flex flex-col items-stretch gap-y-2 px-4">
                <TextX class='text-gray-700/80 font-bold'>Qualifications:</TextX>
                <div>
                    {#each post.qualifications as qualification}
                        <div class="flex items-center gap-x-2">
                            <CheckCircle class='w-4 text-gray-500'/>
                            <TextS>{qualification.qualification}</TextS>
                        </div>
                    {/each}
                    </div>
            </div>

            {#if post.additional_info}
                <div class="flex flex-col items-stretch gap-y-2 px-4">
                    <TextX class='text-gray-700/80 font-bold'>Additional Information:</TextX>
                    <div>
                        <TextS class='text-justify'>{post.additional_info}</TextS>
                    </div>
                </div>
            {/if}

            <div class="flex flex-col items-stretch gap-y-2 border-t border-gray-100 py-4 px-4">
                <TextX class='text-gray-700/80 font-bold'>Target Courses:</TextX>
                <div class="flex flex-col gap-y-1">
                    {#each post.target_courses as course}
                        <div class="flex items-center gap-x-2">
                            <Book class='w-4 text-gray-500'/>
                            <TextS>{course.course.name}</TextS>
                        </div>
                    {/each}
                </div>
            </div>
        </RoundedCard>
    </div>
{/if}

<ConfirmModal
    bind:show={confirmClose}
    text='Close job post?'
    onConfirm={onClose}
/>

<ConfirmModal
    bind:show={confirmDelete}
    text='Delete job post?'
    onConfirm={onDelete}
/>

<Modal
    heading="Repost"
    bind:show={confirmRepost}
    class='md:w-1/4'
>
    <div class="flex flex-col items-stretch gap-y-1 my-2">
        <TextS class='text-gray-500'>Open Until</TextS>

        <input
            bind:value={openUntil.value}
            required={true}
            type="date"
            class="bg-gray-50 border border-gray-200 w-full text-sm py-3 rounded"
            onchange={(e) => {
                if (new Date(e.target.value) <= new Date())
                    openUntil.error = 'Open until date should not be from the past or today.';
                else
                    openUntil.error = '';
            }}
        >

        {#if openUntil.error}
            <TextS class='text-red-500'>{openUntil.error}</TextS>
        {/if}
    </div>

    <ButtonM
        Icon={Upload}
        label='Repost'
        onclick={onRepost}
    />
</Modal>

<Modal
	heading='Edit Post'
	bind:show={openEditModal}
    overflow={true}
	class='md:w-1/2 space-y-0 gap-y-0'
>
	<div class="grid grid-cols-1 gap-x-4">
		<InputText
			label='Position'
			placeholder='Enter the offered position'
			minLength={1}
			maxLength={255}
			bind:value={newPost.position.value}
			bind:error={newPost.position.error}
			onInput={(value) => {
				const val = value.trim();
				
				if (val.length === 0) {
					newPost.position.error = 'Position is required.';
				} else if (val.length > 255) {
					newPost.position.error = 'Position must not exceed 255 characters.';
				} else {
					newPost.position.error = '';
				}
			}}
		/>

		<InputText
			label='Address'
			placeholder='Enter the job address'
			minLength={1}
			maxLength={512}
			bind:value={newPost.address.value}
			bind:error={newPost.address.error}
			onInput={(value) => {
				const val = value.trim();
				
				if (val.length === 0) {
					newPost.address.error = 'Address is required.';
				} else if (val.length > 512) {
					newPost.address.error = 'Address must not exceed 512 characters.';
				} else {
					newPost.address.error = '';
				}
			}}
		/>
		
		<InputTextArea
			label='Description'
			placeholder='Enter position description here...'
			bind:value={newPost.description.value}
			bind:error={newPost.description.error}
			minLength={1}
			maxLength={3000}
			onInput={(value) => {
				const val = value.trim();
				
				if (val.length === 0) {
					newPost.description.error = 'Description is required.';
				} else if (val.length > 255) {
					newPost.description.error = 'Description must not exceed 3000 characters.';
				} else {
					newPost.description.error = '';
				}
			}}
		/>
	</div>

	<div>
		<TextS class='text-gray-500 mb-2'>Qualifications</TextS>
		{#if newPost.qualifications.value.length === 0}
			<div class="flex items-center gap-x-2">
				<Info class='w-4 text-gray-500'/>
				<TextS class='text-gray-600'>You haven't added any qualifications yet.</TextS>
			</div>
		{:else}
			<div class='space-y-1 max-h-32 overflow-auto scrollbar border border-gray-200 rounded p-4'>
				{#each newPost.qualifications.value as qualification}
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-x-2">
							<CheckCircle class='w-4 text-gray-500'/>
							<TextS>{qualification.qualification}</TextS>
						</div>
						<ButtonM
							Icon={Trash}
							onclick={async () => await onRemoveQuali(qualification.id)}
							class='bg-red-500 px-1 py-0'
						/>
					</div>
				{/each}
			</div>
		{/if}
		{#if newPost.qualifications.error}
			<TextS class='text-red-500'>{newPost.qualifications.error}</TextS>
		{/if}
		<InputText
			label='New Qualification'
			placeholder='Enter qualification'
			btnLabel='Add'
			BtnIcon={Plus}
			bind:value={newQuali.value}
			bind:error={newQuali.error}
			minLength={1}
			maxLength={500}
			onInput={(value) => {
				const val = value.trim();
				
				if (val.length === 0) {
					newQuali.error = 'Qualification is required.';
				} else if (val.length > 255) {
					newQuali.error = 'Qualification must not exceed 500 characters.';
				} else {
					newQuali.error = '';
				}
			}}
			onBtnClick={async () => {
				const val = newQuali.value.trim();

				if (val.length === 0) {
					newQuali.error = 'Qualification is required.';
				} else if (val.length > 255) {
					newQuali.error = 'Qualification must not exceed 500 characters.';
				} else {
					newQuali.error = '';
				}

				if (newQuali.error) {
					error('Cannot add qualification yet.');
					return;
				}

				await onAddQuali();
			}}
		/>
	</div>

	<div class="grid grid-cols-1 gap-x-4">
		<InputNumber
			label='Slots'
			placeholder="Enter position slots"
			bind:value={newPost.slots.value}
			bind:error={newPost.slots.error}
			onInput={(value) => {
				if (String(value).length === 0)
					newPost.slots.error = 'Slots are required';
				else if (value <= 0)
					newPost.slots.error = 'Should not be less than or equal to zero.';
				else
					newPost.slots.error = '';
			}}
		/>
	</div>
	
	<div class="grid grid-cols-2 gap-x-4">
		<InputNumber
			label='Minimum Salary'
			placeholder="Enter minimum salary"
			bind:value={newPost.salaryMin.value}
			bind:error={newPost.salaryMin.error}
			onInput={(value) => {
				if (String(value).length === 0)
					newPost.salaryMin.error = 'Minimum salary is required.';
				else if (value <= 0)
					newPost.salaryMin.error = 'Should not be less than or equal to zero.';
				else if (value > newPost.salaryMax.value)
					newPost.salaryMin.error = 'Should not be greater than the maxmimum salary.';
				else
					newPost.salaryMin.error = '';

				if (newPost.salaryMax.value >= value)
					newPost.salaryMax.error = ''
			}}
		/>
		<InputNumber
			label='Maximum Salary'
			placeholder="Enter maximum salary"
			bind:value={newPost.salaryMax.value}
			bind:error={newPost.salaryMax.error}
			onInput={(value) => {
				if (String(value).length === 0)
					newPost.salaryMax.error = 'Maximum salary is required.';
				else if (value <= 0)
					newPost.salaryMax.error = 'Should not be less than or equal to zero.';
				else if (value < newPost.salaryMin.value)
					newPost.salaryMax.error = 'Should not be less than the minimum salary.';
				else
					newPost.salaryMax.error = '';

				if (newPost.salaryMin.value <= value)
					newPost.salaryMin.error = ''
			}}
		/>
	</div>
	<div class="grid grid-cols-3 gap-x-4">
		<Dropdown
			label='Employment Type'
			bind:value={newPost.workEmploymentType.value}
		>
			<DropdownItem label='Full-time' value='Full-time'/>
			<DropdownItem label='Part-time' value='Part-time'/>
			<DropdownItem label='Contract' value='Contract'/>
			<DropdownItem label='Internship' value='Internship'/>
			<DropdownItem label='Freelance' value='Freelance'/>
		</Dropdown>
		<Dropdown
			label='Work Setup'
			bind:value={newPost.workSetup.value}
		>
			<DropdownItem label='On-site' value='On-site'/>
			<DropdownItem label='Remote' value='Remote'/>
			<DropdownItem label='Hybrid' value='Hybrid'/>
		</Dropdown>
		<Dropdown
			label='Work Shift'
			bind:value={newPost.workShift.value}
		>
			<DropdownItem label='Day' value='Day'/>
			<DropdownItem label='Evening / Swing' value='Evening / Swing'/>
			<DropdownItem label='Night / Graveyard' value='Night / Graveyard'/>
			<DropdownItem label='Morning' value='Morning'/>
		</Dropdown>
	</div>
	<div>
		<InputTextArea
			label='Additional Information (optional)'
			placeholder='Enter additional information here...'
			bind:value={newPost.additionalInfo.value}
			bind:error={newPost.additionalInfo.error}
		/>
	</div>
	<div>
		<TextS class='text-gray-500 mb-2'>Target Courses ({newPost.targetCourses.value.length} of {courses.length})</TextS>
		<div class='space-y-1 max-h-32 overflow-auto scrollbar border border-gray-200 rounded p-4'>
			{#each courses as course}
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-x-2">
						<Book class='w-4 text-gray-500'/>
						<TextS>{course.name}</TextS>
					</div>
					<input type="checkbox" checked={post.target_courses.map((tc) => tc.course_id).includes(course.id)} onchange={async (e) => {
                        if (!e.target.checked && newPost.targetCourses.value.length <= 1) {
                            e.target.checked = true;
                            error('Job post should have at least one target course.');
                            return;
                        }
                        
						if (e.target.checked) {
							await onAddTargetCourse(course.id);
						} else {
                            await onRemoveTargetCourse(newPost.targetCourses.value.find((tc) => tc.course_id === course.id).id);
						}
					}} class='rounded cursor-pointer'>
				</div>
			{/each}
		</div>
		{#if newPost.targetCourses.error}
			<TextS class='text-red-500 mt-1'>{newPost.targetCourses.error}</TextS>
		{/if}
	</div>

	<ButtonM
		Icon={Check}
		label='Save Changes'
		class='mt-4'
		onclick={onUpdate}
	/>
</Modal>