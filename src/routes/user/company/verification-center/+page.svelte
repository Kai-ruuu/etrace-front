<script>
	import ButtonM from "$lib/components/global/ButtonM.svelte";
	import InputTextArea from "$lib/components/global/InputTextArea.svelte";
	import Modal from "$lib/components/global/modals/Modal.svelte";
	import TextM from "$lib/components/global/TextM.svelte";
	import TextS from "$lib/components/global/TextS.svelte";
	import TextX from "$lib/components/global/TextX.svelte";
	import AdminHeader from "$lib/components/user/AdminHeader.svelte";
	import { user } from "$lib/stores/user";
	import { get, patchForm, postForm, postJson } from "$lib/utils/api";
	import { error, formatDate, success } from "$lib/utils/ui";
	import { AlertCircle, BadgeCheck, Calendar, CheckCircle, File, Flag, Info, Lock, MessageCircle, Send, ShieldUser, Star, Upload } from "lucide-svelte";
	import { onMount } from "svelte";

	let statusSysad = $derived($user.profile.ver_stat_sysad);
	let statusPstaff = $derived($user.profile.ver_stat_pstaff);

	let rejectionSysad = $derived($user.profile?.rejection_sysad);
	let rejectionPstaff = $derived($user.profile?.rejection_pstaff);

	let appealSysad = $state({ value: '', error: '' });
	let appealPstaff = $state({ value: '', error: '' });
	let appealRevision = $state({ value: '', error: '' });

	let revisionRequests = $state([]);

	let upload = $state(null);
    let uploadUrl = $state(null);
    let uploadOpen = $state(false);
	let uploadDisplay = $state(null);
	let uploadReqId = $state(null);
	let uploadReqKey = $state(null);

	async function onSubmitSysadAppeal() {
		if (
			!appealSysad.value.trim() ||
			appealSysad.error
		) {
			error('Cannot submit appeal yet.');
			return;
		}
		
		await postJson('/api/user/company/write-appeal-sysad',
			{ rejection_id: rejectionSysad.id, appeal: appealSysad.value },
			{
				onSuccess: async (data) => {
					success('Appeal has been sent successfully.');
					user.set({
						...$user,
						profile: {
							...$user.profile,
							rejection_sysad: {
								...$user.profile.rejection_sysad,
								appeal: data
							}
						}
					});
				},
				onFail: async (err) => {
					error(err?.message ?? 'Unable to submit appeal due to an error.');
				},
			}
		);
	}

	async function onSubmitPstaffAppeal() {
		if (
			!appealPstaff.value.trim() ||
			appealPstaff.error
		) {
			error('Cannot submit appeal yet.');
			return;
		}
		
		await postJson('/api/user/company/write-appeal-pstaff',
			{ rejection_id: rejectionPstaff.id, appeal: appealPstaff.value },
			{
				onSuccess: async (data) => {
					success('Appeal has been sent successfully.');
					user.set({
						...$user,
						profile: {
							...$user.profile,
							rejection_pstaff: {
								...$user.profile.rejection_pstaff,
								appeal: data
							}
						}
					});
				},
				onFail: async (err) => {
					error(err?.message ?? 'Unable to submit appeal due to an error.');
				},
			}
		);
	}

	async function onLoadRevisionRequests() {
		await get('/api/user/company/revision-requests', {
			onSuccess: async (data) => revisionRequests = data,
			onFail: async (err) => error(err?.message ?? 'Unable to fetch revision requests.')
		});
	}

	async function onSubmitRevisionAppeal(id) {
		await postJson('/api/user/company/write-appeal-revision/' + id,
			{ appeal: appealRevision.value },
			{
				onSuccess: async (_) => {
					await onLoadRevisionRequests();
					success('Appeal has been sent successfully.');
				},
				onFail: async (err) => error(err?.message ?? 'Unable to submit appeal due to an error.')
			}
		);
	}

	async function onUploadRevision() {
		let formData = new FormData();
		formData.append('requirement_key', uploadReqKey);
		formData.append('requirement', upload);
		
		await postForm('/api/user/company/revise-requirement', formData, {
			onSuccess: async (data) => {
				uploadOpen = false;
				URL.revokeObjectURL(uploadUrl);
				uploadUrl = null;
				upload = null;
				uploadDisplay = null;
				const input = document.getElementById(uploadReqId);
				if (input) input.value = '';

				user.set({
					...data,
					profile: {
						...data.profile,
					}
				});

				await get('/api/user/company/revision-requests', {
					onSuccess: async (fresh) => {
						console.log('Fresh revision requests:', fresh); // 👈 check this
						revisionRequests = [...fresh];
					}
				});
				success('Requirement has been revised.');
			},
			onFail: async (data) => error(data?.message ?? 'Unable to upload revision due to an error.')
		});
	}

	function getReqKeyDisplay(key) {
		return {
			req_company_profile: 'Company Profile',
			req_business_permit: 'Business Permit',
			req_sec: 'SEC',
			req_dti_cda: 'DTI / CDA Reg.',
			req_reg_of_est: 'Registry of Establishment fr. DOLE',
			req_cert_from_dole: 'Certification from DOLE Provincial Office',
			req_cert_no_case: 'Certification of No Pending Case',
			req_philjobnet_reg: 'Phil-JobNet Reg.',
			req_list_of_vacancies: 'List of Vacancies',
		}[key];
	}

	onMount(onLoadRevisionRequests);
</script>

<AdminHeader heading='Verification Center'/>

<div class="flex-1 min-h-0 overflow-y-auto scrollbar p-4 bg-white flex flex-col items-stretch">
	{#if statusSysad === 'Pending'}
		<div class="flex items-center">
			<div class="bg-blue-100 w-10 h-10 flex items-center justify-center rounded-full border border-blue-200">
				<Flag class='w-4 text-blue-900'/>
			</div>
			<div class="pl-4">
				<TextM class='text-blue-900/75 font-bold'>Step 1</TextM>
				<TextX class='text-blue-800'>System Administrator's Verification</TextX>
			</div>
		</div>
	{:else if statusSysad === 'Verified'}
		<div class="flex items-center">
			<div class="bg-green-100 w-10 h-10 flex items-center justify-center rounded-full border border-green-200">
				<BadgeCheck class='w-4 text-green-900/50'/>
			</div>
			<div class="pl-4">
				<TextM class='text-green-900/50 font-bold'>Step 1</TextM>
				<TextX class='text-green-800/50'>System Administrator's Verification</TextX>
			</div>
		</div>
	{:else}
		<div class="flex items-center">
			<div class="bg-red-100 w-10 h-10 flex items-center justify-center rounded-full border border-red-200">
				<AlertCircle class='w-4 text-red-900'/>
			</div>
			<div class="pl-4">
				<TextM class='text-red-900/75 font-bold'>Step 1</TextM>
				<TextX class='text-red-800'>System Administrator's Verification</TextX>
			</div>
		</div>
	{/if}

	{#if statusSysad === 'Pending'}
		<div class="pl-5">
			<div class="border-l border-blue-200 p-4 pl-9">
				<TextS>Please wait while the System Administrator is verifying your account.</TextS>
			</div>
		</div>
	{:else if statusSysad === 'Verified'}
		<div class="pl-5">
			<div class="border-l border-green-200 p-4 pl-9">
				<TextS class='text-gray-700/50'>Complete!</TextS>
			</div>
		</div>
	{:else}
		<div class="pl-5">
			<div class="border-l border-red-200 p-4 pl-9 flex flex-col items-stretch">
				<TextS>Your account has been rejected by the System Administrator. Don't forget to write an appeal.</TextS>

				<div class="flex flex-col gap-y-2 mt-4 border border-l-0 border-r-0 border-t-gray-100 border-b-gray-100 py-4">
					<TextS class='text-gray-700/75'>Rejection Information</TextS>
					<div class="flex flex-col gap-y-2">
						<div class="flex items-center gap-x-2">
							<ShieldUser class='w-4 text-gray-400'/>
							<TextS>
								Rejected by: 
								<span class="text-gray-600 font-bold">{rejectionSysad.rejected_by.first_name + ' ' + rejectionSysad.rejected_by.last_name}</span>
								(System Administrator)
							</TextS>
						</div>
						<div class="flex items-center gap-x-2">
							<Calendar class='w-4 text-gray-400'/>
							<TextS>Rejected on: <span class="text-gray-600 font-bold">{formatDate(rejectionSysad.created_at)}</span></TextS>
						</div>
						<div class="flex flex-col items-stretch">
							<div class="flex items-center gap-x-2">
								<AlertCircle class='w-4 text-red-900/65'/>
								<TextS class='text-red-900'>Rejection reason:</TextS>
							</div>
							<div class="text-sm rounded text-gray-600 ml-6 pt-1">
								{rejectionSysad.message}
							</div>
						</div>
					</div>
				</div>

				{#if rejectionSysad.appeal}
					<div class="flex flex-col gap-y-2 items-stretch mt-2">
						<TextS class='text-gray-700/75'>Appeal Information</TextS>
						<div class="flex flex-col gap-y-2">
							<div class="flex items-center gap-x-2">
								<Calendar class='w-4 text-gray-400'/>
								<TextS>Appealed on: <span class="text-gray-600 font-bold">{formatDate(rejectionSysad.appeal.created_at)}</span></TextS>
							</div>
							<div class="flex flex-col items-stretch">
								<div class="flex items-center gap-x-2">
									<MessageCircle class='w-4 text-gray-400'/>
									<TextS class='text-gray-600'>Appeal:</TextS>
								</div>
								<div class="text-sm rounded text-gray-600 ml-6 pt-1">
									{rejectionSysad.appeal.message}
								</div>
							</div>
						</div>
						<div class="border border-yellow-200 rounded p-2 bg-yellow-50 text-yellow-900 flex items-center">
							<Info class='w-4 mr-2'/>
							<TextS>Please wait for the System Administrator's response.</TextS>
						</div>
					</div>
				{:else}
					<div class="flex flex-col items-stretch mt-2">
						<InputTextArea
							label='Appeal'
							bind:value={appealSysad.value}
							bind:error={appealSysad.error}
							placeholder='Write your appeal here...'
							minLength={1}
							maxLength={1000}
							onInput={(value) => {
								if (!value.trim()) {
									appealSysad.error = 'Appeal is required.';
								} else if (value.trim().length > 1000) {
									appealSysad.error = 'Appeal must not exceed 1000 characters.';
								} else {
									appealSysad.error = '';
								}
							}}
						/>
						<div class="flex justify-end mt-2">
							<ButtonM
								Icon={Send}
								label='Submit'
								onclick={onSubmitSysadAppeal}
							/>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}


	<!-- PESO Staff -->
	{#if statusPstaff === 'Pending'}
		<div class="flex items-center">
			{#if ['Pending', 'Rejected'].includes(statusSysad) }
				<div class="bg-gray-100 w-10 h-10 flex items-center justify-center rounded-full border border-gray-200">
					<Lock class='w-4 text-gray-900/50'/>
				</div>
				<div class="pl-4">
					<TextM class='text-gray-900/50 font-bold'>Step 2</TextM>
					<TextX class='text-gray-800/50'>PESO Staff's Verification</TextX>
				</div>
			{:else}
				<div class="bg-blue-100 w-10 h-10 flex items-center justify-center rounded-full border border-blue-200">
					<Flag class='w-4 text-blue-900'/>
				</div>
				<div class="pl-4">
					<TextM class='text-blue-900/75 font-bold'>Step 2</TextM>
					<TextX class='text-blue-800'>PESO Staff's Verification</TextX>
				</div>
			{/if}
		</div>
	{:else if statusPstaff === 'Verified'}
		<div class="flex items-center">
			<div class="bg-green-100 w-10 h-10 flex items-center justify-center rounded-full border border-green-200">
				<BadgeCheck class='w-4 text-green-900/50'/>
			</div>
			<div class="pl-4">
				<TextM class='text-green-900/50 font-bold'>Step 2</TextM>
				<TextX class='text-green-800/50'>PESO Staff's Verification</TextX>
			</div>
		</div>
	{:else}
		<div class="flex items-center">
			<div class="bg-red-100 w-10 h-10 flex items-center justify-center rounded-full border border-red-200">
				<AlertCircle class='w-4 text-red-900'/>
			</div>
			<div class="pl-4">
				<TextM class='text-red-900/75 font-bold'>Step 2</TextM>
				<TextX class='text-red-800'>PESO Staff's Verification</TextX>
			</div>
		</div>
	{/if}

	{#if statusPstaff === 'Pending'}
		{#if ['Pending', 'Rejected'].includes(statusSysad) }
			<div class="pl-5">
				<div class="border-l border-gray-200 p-4 pl-9">
					<TextS class='text-gray-700/50'>The PESO Staff will now review your submitted requirements. Please comply for revision requests if needed.</TextS>
				</div>
			</div>

			
		{:else}
			<div class="pl-5">
				<div class="border-l border-blue-200 p-4 pl-9">
					<TextS>The PESO Staff will now review your submitted requirements. Please comply for revision requests if needed.</TextS>

					{#if revisionRequests.length > 0}
						<TextS class='mt-4'>Revision Requests:</TextS>
					
						{#each revisionRequests as request}
							<div class="flex flex-col gap-y-2 mt-4 border border-gray-100 p-4 rounded">
								<div class="flex flex-col gap-y-2">
									<div class="flex items-center gap-x-2">
										<File class='w-4 text-gray-400'/>
										<TextS>
											<span class="text-gray-600 font-bold">{getReqKeyDisplay(request.requirement_column)}</span>
											<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-500">
												For Revision
											</span>
										</TextS>
									</div>
									<div class="flex items-center gap-x-2">
										<ShieldUser class='w-4 text-gray-400'/>
										<TextS>
											Requested by: 
											<span class="text-gray-600 font-bold">{request.rejected_by.first_name + ' ' + request.rejected_by.last_name}</span>
											(PESO Staff)
										</TextS>
									</div>
									<div class="flex items-center gap-x-2">
										<Calendar class='w-4 text-gray-400'/>
										<TextS>Requested on: <span class="text-gray-600 font-bold">{formatDate(request.created_at)}</span></TextS>
									</div>
									<div class="flex flex-col items-stretch">
										<div class="flex items-center gap-x-2">
											<AlertCircle class='w-4 text-red-900/65'/>
											<TextS class='text-red-900'>Revision request reason:</TextS>
										</div>
										<div class="text-sm rounded text-gray-600 ml-6 pt-1">
											{request.message}
										</div>
									</div>
								</div>

								{#if request.appeal}
									<div class="flex flex-col gap-y-2 items-stretch">
										<TextS class='text-gray-700/75'>Appeal Information</TextS>
										<div class="flex flex-col gap-y-2">
											<div class="flex items-center gap-x-2">
												<Calendar class='w-4 text-gray-400'/>
												<TextS>Appealed on: <span class="text-gray-600 font-bold">{formatDate(request.appeal.created_at)}</span></TextS>
											</div>
											<div class="flex flex-col items-stretch">
												<div class="flex items-center gap-x-2">
													<MessageCircle class='w-4 text-gray-400'/>
													<TextS class='text-gray-600'>Appeal:</TextS>
												</div>
												<div class="text-sm rounded text-gray-600 ml-6 pt-1">
													{request.appeal.message}
												</div>
											</div>
										</div>
										<div class="border border-yellow-200 rounded p-2 bg-yellow-50 text-yellow-900 flex items-center">
											<Info class='w-4 mr-2'/>
											<TextS>This revision request will automatically disappear once the PESO Staff has approved your requirement.</TextS>
										</div>
									</div>
								{:else}
									<div class="flex flex-col items-stretch">
										<InputTextArea
											label='Appeal'
											bind:value={appealRevision.value}
											bind:error={appealRevision.error}
											placeholder='Please write an appeal here if you think this was a mistake'
											minLength={1}
											maxLength={1000}
											onInput={(value) => {
												if (!value.trim()) {
													appealSysad.error = 'Appeal is required.';
												} else if (value.trim().length > 1000) {
													appealSysad.error = 'Appeal must not exceed 1000 characters.';
												} else {
													appealSysad.error = '';
												}
											}}
										/>
										<div class="flex items-center justify-end mt-2 gap-x-2">
											<input
												id={`requirement_${request.id}`}
												type="file"
												accept=".pdf"
												required={true}
												onchange={(e) => {
													upload = e.target.files?.[0] ?? null;

													if (upload) {
														uploadDisplay = getReqKeyDisplay(request.requirement_column);
														uploadReqKey = request.requirement_column;
														uploadReqId = `requirement_${request.id}`;
														uploadUrl = URL.createObjectURL(upload);
														uploadOpen = true;
													} else {
														error('Something went wrong while adding the file.');
													}
												}}
												class="hidden"
											/>
											<ButtonM
												Icon={Upload}
												label='Upload Revision'
												onclick={() => document.getElementById(`requirement_${request.id}`)?.click()}
											/>
											<TextS>or</TextS>
											<ButtonM
												Icon={Send}
												label='Submit Appeal'
												onclick={async () => await onSubmitRevisionAppeal(request.id)}
											/>
										</div>
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/if}
	{:else if statusPstaff === 'Verified'}
		<div class="pl-5">
			<div class="border-l border-green-200 p-4 pl-9">
				<TextS class='text-gray-700/50'>Complete!</TextS>
			</div>
		</div>
	{:else}
		<div class="pl-5">
			<div class="border-l border-red-200 p-4 pl-9">
				<TextS>Your account has been rejected by the PESO Staff. Don't forget to write an appeal.</TextS>

				<div class="flex flex-col gap-y-2 mt-4 border border-l-0 border-r-0 border-t-gray-100 border-b-gray-100 py-4">
					<TextS class='text-gray-700/75'>Rejection Information</TextS>
					<div class="flex flex-col gap-y-2">
						<div class="flex items-center gap-x-2">
							<ShieldUser class='w-4 text-gray-400'/>
							<TextS>
								Rejected by: 
								<span class="text-gray-600 font-bold">{rejectionPstaff.rejected_by.first_name + ' ' + rejectionPstaff.rejected_by.last_name}</span>
								(PESO Staff)
							</TextS>
						</div>
						<div class="flex items-center gap-x-2">
							<Calendar class='w-4 text-gray-400'/>
							<TextS>Rejected on: <span class="text-gray-600 font-bold">{formatDate(rejectionPstaff.created_at)}</span></TextS>
						</div>
						<div class="flex flex-col items-stretch">
							<div class="flex items-center gap-x-2">
								<AlertCircle class='w-4 text-red-900/65'/>
								<TextS class='text-red-900'>Rejection reason:</TextS>
							</div>
							<div class="text-sm rounded text-gray-600 ml-6 pt-1">
								{rejectionPstaff.message}
							</div>
						</div>
					</div>
				</div>

				{#if rejectionPstaff.appeal}
					<div class="flex flex-col gap-y-2 items-stretch mt-2">
						<TextS class='text-gray-700/75'>Appeal Information</TextS>
						<div class="flex flex-col gap-y-2">
							<div class="flex items-center gap-x-2">
								<Calendar class='w-4 text-gray-400'/>
								<TextS>Appealed on: <span class="text-gray-600 font-bold">{formatDate(rejectionPstaff.appeal.created_at)}</span></TextS>
							</div>
							<div class="flex flex-col items-stretch">
								<div class="flex items-center gap-x-2">
									<MessageCircle class='w-4 text-gray-400'/>
									<TextS class='text-gray-600'>Appeal:</TextS>
								</div>
								<div class="text-sm rounded text-gray-600 ml-6 pt-1">
									{rejectionPstaff.appeal.message}
								</div>
							</div>
						</div>
						<div class="border border-yellow-200 rounded p-2 bg-yellow-50 text-yellow-900 flex items-center">
							<Info class='w-4 mr-2'/>
							<TextS>Please wait for the PESO Staff's response.</TextS>
						</div>
					</div>
				{:else}
					<div class="flex flex-col items-stretch mt-2">
						<InputTextArea
							label='Appeal'
							bind:value={appealPstaff.value}
							bind:error={appealPstaff.error}
							placeholder='Write your appeal here...'
							minLength={1}
							maxLength={1000}
							onInput={(value) => {
								if (!value.trim()) {
									appealPstaff.error = 'Appeal is required.';
								} else if (value.trim().length > 1000) {
									appealPstaff.error = 'Appeal must not exceed 1000 characters.';
								} else {
									appealPstaff.error = '';
								}
							}}
						/>
						<div class="flex justify-end mt-2">
							<ButtonM
								Icon={Send}
								label='Submit'
								onclick={onSubmitPstaffAppeal}
							/>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}


	<!-- Completion -->
	{#if statusSysad !== 'Verified' || statusPstaff !== 'Verified'}
		<div class="flex items-center">
			<div class="bg-gray-100 w-10 h-10 flex items-center justify-center rounded-full border border-gray-200">
				<Lock class='w-4 text-gray-900/50'/>
			</div>
			<div class="pl-4">
				<TextM class='text-gray-900/50 font-bold'>Completion</TextM>
				<TextX class='text-gray-800/50'>Fully Verified</TextX>
			</div>
		</div>
	{:else}
		<div class="flex items-center">
			<div class="bg-green-100 w-10 h-10 flex items-center justify-center rounded-full border border-green-200">
				<Star class='w-4 text-green-900'/>
			</div>
			<div class="pl-4">
				<TextM class='text-green-900/75 font-bold'>Completion</TextM>
				<TextX class='text-green-800'>Fully Verified</TextX>
			</div>
		</div>
	{/if}

	{#if statusSysad !== 'Verified' || statusPstaff !== 'Verified'}
		<div class="pl-5">
			<div class="p-4 pl-9 text-gray-700/50">
				<TextS>Congratulations, your account is now fully verified! Job posts management is now enabled.</TextS>
			</div>
		</div>
	{:else}
		<div class="pl-5">
			<div class="p-4 pl-9">
				<TextS>Congratulations, your account is now fully verified! Job posts management is now enabled.</TextS>
			</div>
		</div>
	{/if}
</div>

<Modal
    bind:show={uploadOpen}
    heading={uploadDisplay}
    class='md:w-2/3 h-full space-y-2'
    onExit={() => {
		URL.revokeObjectURL(uploadUrl);
		uploadUrl = null;
		upload = null;
		uploadDisplay = null;
		const input = document.getElementById(uploadReqId);
		
		if (input) input.value = '';
	}}
>
    <iframe
        frameborder="0"
        title={uploadDisplay}
        src={uploadUrl + '#toolbar=0&navpanes=0view=Fit'}
        class="scrollbar grow bg-white rounded-lg overflow-clip"
    >
    </iframe>
    <ButtonM
        Icon={Upload}
        label='Update'
		onclick={onUploadRevision}
    />
</Modal>