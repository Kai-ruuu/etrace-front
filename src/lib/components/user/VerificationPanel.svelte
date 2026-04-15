<script>
	import ButtonM from "$lib/components/global/ButtonM.svelte";
	import InputTextArea from "$lib/components/global/InputTextArea.svelte";
	import TextM from "$lib/components/global/TextM.svelte";
	import TextS from "$lib/components/global/TextS.svelte";
	import TextX from "$lib/components/global/TextX.svelte";
	import AdminHeader from "$lib/components/user/AdminHeader.svelte";
	import { user } from "$lib/stores/user";
	import { get, postJson } from "$lib/utils/api";
	import { error, formatDate, success } from "$lib/utils/ui";
	import { AlertCircle, BadgeCheck, Calendar, CheckCircle, File, Flag, Info, Lock, MessageCircle, Send, ShieldUser, Star } from "lucide-svelte";
	import { onMount } from "svelte";

    let { profile } = $props();

	let status = $derived($user.profile.ver_stat_dean);

	let rejection = $derived($user.profile?.rejection_dean);

	let appeal = $state({ value: '', error: '' });

	async function onSubmitAppeal() {
		if (
			!appeal.value.trim() ||
			appeal.error
		) {
			error('Cannot submit appeal yet.');
			return;
		}
		
		await postJson('/api/user/company/write-appeal',
			{ rejection_id: rejection.id, appeal: appeal.value },
			{
				onSuccess: async (data) => {
					success('Appeal has been sent successfully.');
					user.set({
						...$user,
						profile: {
							...$user.profile,
							rejection_dean: {
								...$user.profile.rejection_dean,
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
</script>

<div class="w-full min-h-full overflow-y-auto scrollbar p-4 bg-white flex flex-col items-stretch">
	<TextM class='font-bold text-gray-700/80'>Verification Center</TextM>

	{#if status === 'Pending'}
		<div class="flex items-center pt-4">
			<div class="bg-blue-100 w-10 h-10 flex items-center justify-center rounded-full border border-blue-200">
				<Flag class='w-4 text-blue-900'/>
			</div>
			<div class="pl-4">
				<TextM class='text-blue-900/75 font-bold'>Step 1</TextM>
				<TextX class='text-blue-800'>Dean's Verification</TextX>
			</div>
		</div>
	{:else if status === 'Verified'}
		<div class="flex items-center pt-4">
			<div class="bg-green-100 w-10 h-10 flex items-center justify-center rounded-full border border-green-200">
				<BadgeCheck class='w-4 text-green-900/50'/>
			</div>
			<div class="pl-4">
				<TextM class='text-green-900/50 font-bold'>Step 1</TextM>
				<TextX class='text-green-800/50'>Dean's Verification</TextX>
			</div>
		</div>
	{:else}
		<div class="flex items-center pt-4">
			<div class="bg-red-100 w-10 h-10 flex items-center justify-center rounded-full border border-red-200">
				<AlertCircle class='w-4 text-red-900'/>
			</div>
			<div class="pl-4">
				<TextM class='text-red-900/75 font-bold'>Step 1</TextM>
				<TextX class='text-red-800'>Dean's Verification</TextX>
			</div>
		</div>
	{/if}

	{#if status === 'Pending'}
		<div class="pl-5">
			<div class="border-l border-blue-200 p-4 pl-9">
				<TextS>Please wait while the Dean is verifying your account.</TextS>
			</div>
		</div>
	{:else if status === 'Verified'}
		<div class="pl-5">
			<div class="border-l border-green-200 p-4 pl-9">
				<TextS class='text-gray-700/50'>Complete!</TextS>
			</div>
		</div>
	{:else}
		<div class="pl-5">
			<div class="border-l border-red-200 p-4 pl-9 flex flex-col items-stretch">
				<TextS>Your account has been rejected by the Dean. Don't forget to write an appeal.</TextS>

				<div class="flex flex-col gap-y-2 mt-4 border border-l-0 border-r-0 border-t-gray-100 border-b-gray-100 py-4">
					<TextS class='text-gray-700/75'>Rejection Information</TextS>
					<div class="flex flex-col gap-y-2">
						<div class="flex items-center gap-x-2">
							<ShieldUser class='w-4 text-gray-400'/>
							<TextS>
								Rejected by: 
								<span class="text-gray-600 font-bold">{rejection.rejected_by.first_name + ' ' + rejection.rejected_by.last_name}</span>
								(Dean)
							</TextS>
						</div>
						<div class="flex items-center gap-x-2">
							<Calendar class='w-4 text-gray-400'/>
							<TextS>Rejected on: <span class="text-gray-600 font-bold">{formatDate(rejection.created_at)}</span></TextS>
						</div>
						<div class="flex flex-col items-stretch">
							<div class="flex items-center gap-x-2">
								<AlertCircle class='w-4 text-red-900/65'/>
								<TextS class='text-red-900'>Rejection reason:</TextS>
							</div>
							<div class="text-sm rounded text-gray-600 ml-6 pt-1">
								{rejection.message}
							</div>
						</div>
					</div>
				</div>

				{#if rejection.appeal}
					<div class="flex flex-col gap-y-2 items-stretch mt-2">
						<TextS class='text-gray-700/75'>Appeal Information</TextS>
						<div class="flex flex-col gap-y-2">
							<div class="flex items-center gap-x-2">
								<Calendar class='w-4 text-gray-400'/>
								<TextS>Appealed on: <span class="text-gray-600 font-bold">{formatDate(rejection.appeal.created_at)}</span></TextS>
							</div>
							<div class="flex flex-col items-stretch">
								<div class="flex items-center gap-x-2">
									<MessageCircle class='w-4 text-gray-400'/>
									<TextS class='text-gray-600'>Appeal:</TextS>
								</div>
								<div class="text-sm rounded text-gray-600 ml-6 pt-1">
									{rejection.appeal.message}
								</div>
							</div>
						</div>
						<div class="border border-yellow-200 rounded p-2 bg-yellow-50 text-yellow-900 flex items-center">
							<Info class='w-4 mr-2'/>
							<TextS>Please wait for the Dean's response.</TextS>
						</div>
					</div>
				{:else}
					<div class="flex flex-col items-stretch mt-2">
						<InputTextArea
							label='Appeal'
							bind:value={appeal.value}
							bind:error={appeal.error}
							placeholder='Write your appeal here...'
							minLength={1}
							maxLength={1000}
							onInput={(value) => {
								if (!value.trim()) {
									appeal.error = 'Appeal is required.';
								} else if (value.trim().length > 1000) {
									appeal.error = 'Appeal must not exceed 1000 characters.';
								} else {
									appeal.error = '';
								}
							}}
						/>
						<div class="flex justify-end mt-2">
							<ButtonM
								Icon={Send}
								label='Submit'
								onclick={onSubmitAppeal}
							/>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Completion -->
	{#if status !== 'Verified'}
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

	{#if status !== 'Verified'}
		<div class="pl-5">
			<div class="p-4 pl-9 text-gray-700/50">
				<TextS>Congratulations, your account is now verified! You can now browse job opportunities.</TextS>
			</div>
		</div>
	{:else}
		<div class="pl-5">
			<div class="p-4 pl-9">
				<TextS>Congratulations, your account is now verified! You can now browse job opportunities.</TextS>
			</div>
		</div>
	{/if}
</div>