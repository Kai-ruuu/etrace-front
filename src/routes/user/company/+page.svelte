<script>
	import { goto } from "$app/navigation";
	import ButtonM from "$lib/components/global/ButtonM.svelte";
	import Dropdown from "$lib/components/global/Dropdown.svelte";
	import DropdownItem from "$lib/components/global/DropdownItem.svelte";
	import InputNumber from "$lib/components/global/InputNumber.svelte";
	import InputText from "$lib/components/global/InputText.svelte";
	import InputTextArea from "$lib/components/global/InputTextArea.svelte";
	import Modal from "$lib/components/global/modals/Modal.svelte";
	import Pagination from "$lib/components/global/Pagination.svelte";
	import RoundedCard from "$lib/components/global/RoundedCard.svelte";
	import TextM from "$lib/components/global/TextM.svelte";
	import TextS from "$lib/components/global/TextS.svelte";
	import TextX from "$lib/components/global/TextX.svelte";
	import AdminHeader from "$lib/components/user/AdminHeader.svelte";
	import JobAddressModal from "$lib/components/user/JobAddressModal.svelte";
	import JobPostC from "$lib/components/user/JobPostC.svelte";
	import { user } from "$lib/stores/user";
	import { apiUrl, get, patchJson, postJson } from "$lib/utils/api";
	import { error, formatDate, success } from "$lib/utils/ui";
	import { BadgeCheck, Book, Briefcase, CheckCircle, ChevronRight, CircleDollarSign, Info, Link, MapPin, Plus, Scroll, Search, SunMoon, Trash, Upload, UserSearch } from "lucide-svelte";
	import { onMount } from "svelte";

	let openFilter = $state(true);
	let empTypeFilter = $state(null);
	let setupFilter = $state(null);
	let shiftFilter = $state(null);
	let query = $state('');
	let openAddModal = $state(false);

	let data = $state({
        results: null,
        total: 0,
        page: 1,
        per_page: 20,
        total_pages: 0,
        has_next: false,
        has_prev: false,
    });

	let courses = $state([]);

	let newPost = $state({
		position: { value: '', error: '' },
		address: { value: '', error: '' },
		slots: { value: 0, error: '' },
		salaryMin: { value: 0, error: '' },
		salaryMax: { value: 0, error: '' },
		workEmploymentType: { value: 'Full-time', error: '' },
		workSetup: { value: 'On-site', error: '' },
		workShift: { value: 'Day', error: '' },
		openUntil: { value: null, error: '' },
		description: { value: '', error: '' },
		qualifications: { value: [], error: '' },
		additionalInfo: { value: null, error: '' },
		targetCourses: { value: [], error: ''},
	});
	let newQuali = $state({ value: '', error: '' });
	let submissions = $state([]);
	let openSubmissions = $state(false);
	let openCvModal = $state(false);
	let openCvModalUrl = $state(null);
	let openProfile = $state(false);
	let openedProfile = $state(null);
	let openMapModal = $state(false);
    let openMapModalAddress = $state(false);

	async function onSearch() {
        await get('/api/job-post/for-company', {
            query: {
                open: openFilter ?? '',
                emp_type: empTypeFilter ?? '',
                setup: setupFilter ?? '',
                shift: shiftFilter ?? '',
				query,
                page: data.page,
                per_page: data.per_page,
            },
            onSuccess: async (newData) => {
                data.results = newData.results;
                data.total = newData.total;
                data.page = newData.page;
                data.per_page = newData.per_page;
                data.total_pages = newData.total_pages;
                data.has_next = newData.has_next;
                data.has_prev = newData.has_prev;
            },
            onFail: async (newData) => error(newData?.message ?? 'Unable to fetch job posts.'),
        });
    }

	async function onPost() {
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
			newPost.openUntil.error ||
			newPost.description.error ||
			newPost.qualifications.error ||
			newPost.additionalInfo.error ||
			newPost.targetCourses.error
		) {
			error('Cannot post job yet.');
			return;
		}

		await postJson('/api/job-post',
			{
				position: newPost.position.value,
				address: newPost.address.value,
				slots: newPost.slots.value,
				salary_min: newPost.salaryMin.value,
				salary_max: newPost.salaryMax.value,
				work_employment_type: newPost.workEmploymentType.value,
				work_setup: newPost.workSetup.value,
				work_shift: newPost.workShift.value,
				open_until: newPost.openUntil.value,
				description: newPost.description.value,
				qualifications: JSON.stringify(newPost.qualifications.value),
				additional_info: newPost.additionalInfo.value,
				target_courses: JSON.stringify(newPost.targetCourses.value),
			},
			{
				onSuccess: async (_) => {
					openAddModal = false;
					await onSearch();
					success('Job has been posted!');
				},
				onFail: async (err) => error(err?.message ?? 'Unable to post job due to error.')
			}
		);
	}

	async function onLoadSubmissions(id) {
		await get('/api/job-post-submission/for-company/' + id, {
			onSuccess: async (_data) => {
				submissions = _data;
				openSubmissions = true;
				console.log(submissions);
			},
			onFail: async (err) => error('Unable to fetch submissions due to an error.')
		});
	}

	async function onReviewSubmission(id) {
		await patchJson('/api/job-post-submission/' + id, null, {
			onSuccess: async (_data) => {
				submissions = submissions.map((s) => s.id === id ? { ...s, status: 'Reviewed' } : s);
				success(_data?.message ?? 'CV submission has been marked as Reviewed.');
			},
			onFail: async (err) => error('Unable to set submission as reviewed due to an error.')
		})
	}

	onMount(async () => {
		newPost.address.value = $user.profile.address;
		
		await get('/api/institution/course/all', {
			onSuccess: async (_data) => courses = _data,
			onFail: async (err) => error(err?.message ?? 'Unable to fetch courses.')
		});

		console.log(courses);
		
		await onSearch();
	});
</script>

<AdminHeader heading='Manage Job Posts'/>

{#if $user.profile.ver_stat_sysad === 'Verified' && $user.profile.ver_stat_pstaff === 'Verified'}
	<div class="flex-1 min-h-0 space-y-2 overflow-y-hidden px-4 pt-0 bg-white flex flex-col items-stretch">
		<div class="flex items-end gap-x-4">
			<div class="flex items-end gap-x-4 grow">
				<Dropdown
					label='Status'
					bind:value={openFilter}
					onChange={async () => {
						data.page = 1;
						await onSearch();
					}}
				>
					<DropdownItem label='Open' value={true}/>
					<DropdownItem label='Close' value={false}/>
				</Dropdown>
				<Dropdown
					label='Employment Type'
					bind:value={empTypeFilter}
					onChange={async () => {
						data.page = 1;
						await onSearch();
					}}
				>
					<DropdownItem label='All' value={null}/>
					<DropdownItem label='Full-time' value='Full-time'/>
					<DropdownItem label='Part-time' value='Part-time'/>
					<DropdownItem label='Contract' value='Contract'/>
					<DropdownItem label='Internship' value='Internship'/>
					<DropdownItem label='Freelance' value='Freelance'/>
				</Dropdown>
				<Dropdown
					label='Work Setup'
					bind:value={setupFilter}
					onChange={async () => {
						data.page = 1;
						await onSearch();
					}}
				>
					<DropdownItem label='All' value={null}/>
					<DropdownItem label='On-site' value='On-site'/>
					<DropdownItem label='Remote' value='Remote'/>
					<DropdownItem label='Hybrid' value='Hybrid'/>
				</Dropdown>
				<Dropdown
					label='Work Shift'
					bind:value={shiftFilter}
					onChange={async () => {
						data.page = 1;
						await onSearch();
					}}
				>
					<DropdownItem label='All' value={null}/>
					<DropdownItem label='Day' value='Day'/>
					<DropdownItem label='Evening / Swing' value='Evening / Swing'/>
					<DropdownItem label='Night / Graveyard' value='Night / Graveyard'/>
					<DropdownItem label='Morning' value='Morning'/>
				</Dropdown>
				<InputText
					label='Search'
					placeholder='Search job posts'
					bind:value={query}
					class='grow'
					allowClear={true}
					onClear={onSearch}
					BtnIcon={Search}
					btnLabel='Search'
					onBtnClick={onSearch}
				/>
			</div>
			<ButtonM
				Icon={Plus}
				label='Add'
				onclick={() => openAddModal = true}
				class='mb-3'
			/>
		</div>

		<div class="grow min-h-0">
			<div class="w-full overflow-auto rounded max-h-full max-w-[calc(75vw-32px)] scrollbar-hidden">
				<div class="grid md:grid-cols-2 gap-4">
					{#each data.results as post}
						<JobPostC
							{post}
							{onSearch}
							{openFilter}
							{courses}
							onViewSubmissions={onLoadSubmissions}
							onChangesSaved={() => success('Changes has been saved!')}
						/>
					{/each}
				</div>
			</div>
		</div>

		<Pagination {data} {onSearch} class='sticky bottom-0'/>
	</div>

	<Modal
		heading="Post's CV Submissions"
		bind:show={openSubmissions}
		class='md:w-2/3 space-y-0 gap-y-0 max-h-full h-full overflow-y-auto'
	>
		<div class="grow min-h-0 relative pt-6">
			<div class="w-full overflow-auto rounded border border-gray-200 h-full max-h-full scrollbar">
				<table class="w-full text-sm text-left">
					<thead>
						<tr class="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide sticky top-0 z-10 *:text-nowrap">
							<th class="px-4 py-3 font-medium">Name</th>
							<th class="px-4 py-3 font-medium">Course</th>
							<th class="px-4 py-3 font-medium">Batch</th>
							<th class="px-4 py-3 font-medium">Review Status</th>
							<th class="px-4 py-3 font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each submissions as sub (sub.id)}
							<tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors **:text-nowrap">
								<td class="px-4 py-3 text-gray-800">
									<div class='flex items-center gap-x-2'>
										<div 
											style={`background-image: url(${apiUrl('/Uploads/alumni/profile_picture/' + sub.alumni.profile_picture)})`}
											class="w-8 h-8 bg-cover bg-center rounded-full border border-gray-200"
										></div>
										<TextS>{sub.alumni.first_name}{sub.alumni.name_extension && ' ' + sub.alumni.name_extension}{sub.alumni.middle_name && ' ' + sub.alumni.middle_name} {sub.alumni.last_name}</TextS>
									</div>
								</td>
								<td class="px-4 py-3 text-gray-800">{sub.alumni.course.name}</td>
								<td class="px-4 py-3 text-gray-800">{sub.alumni.graduation_year}</td>
								<td class="px-4 py-3">
									{#if sub.status === 'Reviewed'}
										<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">
											Reviewed
										</span>
									{:else}
										<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-600">
											Pending
										</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									<div class="flex items-center gap-x-2">
										<button
											onclick={() => {
												openedProfile = sub.alumni;
												openProfile = true;
											}}
											class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-blue-100 text-blue-500 hover:bg-blue-50"
										>
											View Profile
										</button>
										<button
											onclick={() => {
												openCvModalUrl = sub.alumni.cv;
												openCvModal = true;
											}}
											class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-blue-100 text-blue-500 hover:bg-blue-50"
										>
											View CV
										</button>
										{#if sub.status === 'Pending'}
											<button
												onclick={async () => await onReviewSubmission(sub.id)}
												class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-green-100 text-green-500 hover:bg-green-50"
											>
												Mark as Reviewed
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</Modal>

	<Modal
		heading='Create New Post'
		bind:show={openAddModal}
		class='md:w-1/2 space-y-0 gap-y-0'
		overflow={true}
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
								<TextS>{qualification}</TextS>
							</div>
							<ButtonM
								Icon={Trash}
								onclick={() => newPost.qualifications.value = [...newPost.qualifications.value.filter((q) => q !== qualification)]}
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
				onBtnClick={() => {
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

					newPost.qualifications.value = [...newPost.qualifications.value, newQuali.value];
					newQuali.value = '';
				}}
			/>
		</div>

		<div class="grid grid-cols-2 gap-x-4">
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
			<div class="flex flex-col items-stretch gap-y-1 my-2">
				<TextS class='text-gray-500'>Open Until</TextS>

				<input
					bind:value={newPost.openUntil.value}
					required={true}
					type="date"
					class="bg-gray-50 border border-gray-200 w-full text-sm py-3 rounded"
					onchange={(e) => newPost.openUntil.error = (new Date(e.target.value) <= new Date()) ? 'Open until date should not be from the past or today.' : ''}
				>

				{#if newPost.openUntil.error}
					<TextS class='text-red-500'>{newPost.openUntil.error}</TextS>
				{/if}
			</div>
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
						<input type="checkbox" onchange={(e) => {
							if (e.target.checked) {
								newPost.targetCourses.value = [...newPost.targetCourses.value, course.id]
							} else {
								newPost.targetCourses.value = [...newPost.targetCourses.value.filter((cid) => cid !== course.id)]

								if (newPost.targetCourses.value.length === 0)
									newPost.targetCourses.error = 'Job post should have at least one target course.';
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
			Icon={Upload}
			label='Post'
			class='mt-4'
			onclick={onPost}
		/>
	</Modal>
{:else}
	<div class="flex-1 min-h-0 space-y-2 px-4 pt-0 bg-white flex items-center justify-center">
		<div class="flex flex-col items-center gap-y-2">
			<img src="/error.gif" alt="error.gif" width="80">
			<TextS class='text-center mb-2'>You cannot manage job posts yet. <br> Your account needs to be fully verified first.</TextS>
			<ButtonM
				iconRight={true}
				Icon={ChevronRight}
				label='Verification Center'
				onclick={() => goto('/user/company/verification-center')}
			/>
		</div>
	</div>
{/if}

<Modal
    bind:show={openProfile}
    heading='Alumni Profile'
    class='md:w-2/3 h-full'
>
    <div class="flex-1 min-h-0 space-y-2 overflow-y-hidden pt-0 bg-white flex flex-col items-stretch">
        <div class="w-full overflow-auto max-h-full scrollbar">
            <div class="flex flex-col overflow-clip">
                <div class="flex items-center justify-between p-4">
                    <div class="grow flex items-center gap-x-3">
                        <div 
                            style={`background-image: url(${apiUrl('/Uploads/alumni/profile_picture/' + openedProfile.profile_picture)})`}
                            class="w-10 h-10 bg-cover bg-center rounded-full border border-gray-200"
                        ></div>
                        <h1 class='text-xl max-w-7/10 truncate flex items gap-x-3'>{openedProfile.first_name}{openedProfile.name_extension && ' ' + openedProfile.name_extension}{openedProfile.middle_name && ' ' + openedProfile.middle_name} {openedProfile.last_name}</h1>
                    </div>
                </div>
                
                <div class="flex flex-col gap-y-2 p-4 border-t border-gray-100">
                    <TextS class='text-gray-700/75'>Employment Information</TextS>

                    <div class="grid grid-cols-3 gap-4">
                        <div class="flex flex-col items-stretch space-y-2">
                            <TextX class='font-bold text-gray-700/80'>Status</TextX>
                            {#if openedProfile.employment_status === 'Employed'}
                                <span class="w-fit inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">
                                    Employed
                                </span>
                            {:else if openedProfile.employment_status === 'Self-employed'}
                                <span class="w-fit inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">
                                    Self-employed
                                </span>
                            {:else}
                                <span class="w-fit inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-500">
                                    Unemployed
                                </span>
                            {/if}
                        </div>
    
                        <div class="flex flex-col items-stretch space-y-2 col-span-2">
                            <TextX class='font-bold text-gray-700/80'>Curriculum Vitae</TextX>
                            <button 
                                onclick={() => {
                                    openCvModalUrl = openedProfile.cv;
                                    openCvModal = true;
									console.log(true);
                                }}
                                class="flex items-center gap-x-2 cursor-pointer"
                            >
                                <Link class='text-gray-600 w-4'/>
                                <TextS class='max-w-full truncate underline'>{openedProfile.cv}</TextS>
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex flex-col items-stretch space-y-2">
                        <div class="flex flex-col gap-y-2">
                            <TextX class='font-bold text-gray-700/80'>Employment History</TextX>
                            <div class="max-h-full grid md:grid-cols-3 gap-x-4">
                                {#each openedProfile.occupations as occ}
                                    <div class="flex items-center gap-x-3 rounded w-full p-2 border border-gray-100 hover:bg-gray-50 transition-colors">
                                        <div class="grow flex items-center gap-x-4">
                                            <div class="w-8 h-8 rounded flex items-center justify-center bg-gray-100">
                                                <Briefcase class='w-4 text-gray-600'/>
                                            </div>
                                            <div class="grow flex flex-col items-start">
                                                <TextS class='max-w-full truncate'>{occ.occupation.name}</TextS>
                                                <TextX class='text-gray-500 max-w-full truncate'>{occ.start_year} - {!occ.end_year ? 'Present' : occ.end_year} at <span class="font-bold">{occ.company}</span></TextX>
                                            </div>
                                        </div>
                                        <ButtonM
                                            Icon={MapPin}
                                            class='px-1 py-0'
											onclick={() => {
												openMapModalAddress = occ.address;
												openMapModal = true;
											}}
                                        />
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>
                </div>
        
                <div class="flex flex-col gap-y-2 p-4 border-t border-gray-100">
                    <TextS class='text-gray-700/75'>Personal Information</TextS>

                    <div class='grid grid-cols-3 gap-4'>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>First Name</TextX>
                            <TextS class='max-w-full truncate'>{openedProfile.first_name}{openedProfile.name_extension && ' ' + openedProfile.name_extension}</TextS>
                        </div>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>Middle Name</TextX>
                            <TextS class='max-w-full truncate'>{openedProfile.middle_name ? openedProfile.middle_name : 'N/A'}</TextS>
                        </div>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>Last Name</TextX>
                            <TextS class='max-w-full truncate'>{openedProfile.last_name}</TextS>
                        </div>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>Birth Date</TextX>
                            <TextS class='max-w-full truncate'>{formatDate(openedProfile.birth_date)}</TextS>
                        </div>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>Birth Place</TextX>
                            <TextS class='max-w-full truncate'>{openedProfile.birth_place}</TextS>
                        </div>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>Gender</TextX>
                            <TextS class='max-w-full truncate'>{openedProfile.gender}</TextS>
                        </div>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>Civil Status</TextX>
                            <TextS class='max-w-full truncate'>{openedProfile.civil_status}</TextS>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-y-2 p-4 border-t border-gray-100">
                    <TextS class='text-gray-700/75'>Contact Information</TextS>

                    <div class="space-y-4">
                        <div class='grid grid-cols-3 gap-4'>
                            <div class="flex flex-col items-stretch space-y-1">
                                <TextX class='font-bold text-gray-700/80'>Email Address</TextX>
                                <TextS class='max-w-full truncate'>{openedProfile.email}</TextS>
                            </div>
                            <div class="flex flex-col items-stretch space-y-1">
                                <TextX class='font-bold text-gray-700/80'>Phone Number</TextX>
                                <TextS class='max-w-full truncate'>{openedProfile.phone_number}</TextS>
                            </div>
                            <div class="flex flex-col items-stretch space-y-1">
                                <TextX class='font-bold text-gray-700/80'>Address</TextX>
                                <TextS class='max-w-full truncate'>{openedProfile.address}</TextS>
                            </div>
                            <div class="flex flex-col items-stretch space-y-1 col-span-3">
                                <TextX class='font-bold text-gray-700/80'>Social Media:</TextX>
                                <div class="flex flex-col gap-y-2">
                                    {#each openedProfile.social_medias as socmed}
                                        <a href={socmed.url} target="_blank" class="flex items-center gap-x-2">
                                            <Link class='text-gray-600 w-4'/>
                                            <TextS class='max-w-full truncate underline'>{socmed.platform.name}</TextS>
                                        </a>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-y-2 p-4 border-t border-gray-100">
                    <TextS class='text-gray-700/75'>Academic Information</TextS>

                    <div class="space-y-4">
                        <div class='grid grid-cols-3 gap-4'>
                            <div class="flex flex-col items-stretch space-y-1">
                                <TextX class='font-bold text-gray-700/80'>Course</TextX>
                                <TextS class='max-w-full truncate'>{openedProfile.course.name}</TextS>
                            </div>
                            <div class="flex flex-col items-stretch space-y-1">
                                <TextX class='font-bold text-gray-700/80'>Student Number</TextX>
                                <TextS class='max-w-full truncate'>{openedProfile.student_number ? openedProfile.student_number : 'N/A'}</TextS>
                            </div>
                            <div class="flex flex-col items-stretch space-y-1">
                                <TextX class='font-bold text-gray-700/80'>Batch</TextX>
                                <TextS class='max-w-full truncate'>{openedProfile.graduation_year}</TextS>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</Modal>

<Modal
    bind:show={openCvModal}
    heading={openCvModalUrl}
    class='md:w-2/3 h-full'
>
    <iframe
        frameborder="0"
        title="Alumni CV"
        src={apiUrl('/Uploads/alumni/cv/' + openCvModalUrl + '#toolbar=0&navpanes=0view=Fit')}
        class="scrollbar grow bg-white rounded-lg overflow-clip"
    >
    </iframe>
</Modal>

<JobAddressModal
	bind:show={openMapModal}
	address={openMapModalAddress}
/>