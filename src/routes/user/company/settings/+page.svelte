<script>
	import ButtonM from "$lib/components/global/ButtonM.svelte";
	import InputText from "$lib/components/global/InputText.svelte";
	import Modal from "$lib/components/global/modals/Modal.svelte";
	import RoundedCard from "$lib/components/global/RoundedCard.svelte";
	import TextM from "$lib/components/global/TextM.svelte";
	import TextS from "$lib/components/global/TextS.svelte";
	import TextX from "$lib/components/global/TextX.svelte";
	import AdminHeader from "$lib/components/user/AdminHeader.svelte";
	import LogoUpload from "$lib/components/user/LogoUpload.svelte";
	import Requirement from "$lib/components/user/Requirement.svelte";
	import { user } from "$lib/stores/user";
	import { apiUrl, patchJson } from "$lib/utils/api";
	import { error, formatDate, success } from "$lib/utils/ui";
	import { Check, ChevronRight, File, Link, Lock, Pen, Shield, Upload, User } from "lucide-svelte";
	import { onMount } from "svelte";

	let profileInfo = $state({
		name: { value: '', error: '' },
		address: { value: '', error: '' },
	});
	
	let openProfileSettings = $state(false);
	let profileEditOn = $state(false);

	let openAccountSettings = $state(false);
	let passwordEditOn = $state(false);

	function loadLocalProfile() {
		profileInfo.name.value = $user.profile.name;
		profileInfo.address.value = $user.profile.address;
	}

	function validateName(value) {
		let val = String(value).trim();

		if (val.length === 0)
			profileInfo.name.error = 'Company name is required.';
		else if (val.length > 255)
			profileInfo.name.error = 'Company name must not exceed 255 characters.';
		else
			profileInfo.name.error = '';
	}

	function validateAddress(value) {
		let val = String(value).trim();

		if (val.length === 0)
			profileInfo.address.error = 'Company address is required.';
		else if (val.length < 10)
			profileInfo.address.error = 'Company address must have at least 10 characters.';
		else if (val.length > 512)
			profileInfo.address.error = 'Company address must not exceed 512 characters.';
		else
			profileInfo.address.error = '';
	}

	async function validateAndSubmit() {
		validateName(profileInfo.name.value);
		validateAddress(profileInfo.address.value);

		if (profileInfo.name.error || profileInfo.address.error) {
			error('Cannot save changes yet.');
			return
		}

		await patchJson('/api/user/company/renew-basic-info',
			{
				name: profileInfo.name.value,
				address: profileInfo.address.value,
			},
			{
				onSuccess: async (data) => {
					user.set({
						...data,
						profile: {
							...data.profile,
						}
					});
					profileEditOn = false;
					success(data?.message ?? 'Basic company information has been renewed.');
				},
				onFail: async (err) => error(err?.message ?? 'Unable to renew basic information due to an error.')
			}
		);
	}

	onMount(loadLocalProfile);
</script>

<AdminHeader heading='Settings'/>

<div class="flex-1 min-h-0 overflow-y-hidden bg-white flex flex-col items-stretch py-2">
	<div class='flex items-center justify-between px-4 py-2 rounded-none'>
		<div class="flex items-center gap-x-4">
			<div class="w-8 h-8 bg-gray-50 border border-gray-100 rounded flex items-center justify-center">
				<User class='min-w-4 max-w-4 text-gray-600'/>
			</div>
			<div class="flex flex-col">
				<TextM>Profile Settings</TextM>
				<TextX class='text-gray-500'>View and Manage your profile</TextX>
			</div>
		</div>
		<ButtonM
			Icon={ChevronRight}
			class='px-1 py-0'
			onclick={() => openProfileSettings = true}
		/>
	</div>
	<div class='flex items-center justify-between px-4 py-2 rounded-none'>
		<div class="flex items-center gap-x-4">
			<div class="w-8 h-8 bg-gray-50 border border-gray-100 rounded flex items-center justify-center">
				<Shield class='min-w-4 max-w-4 text-gray-600'/>
			</div>
			<div class="flex flex-col">
				<TextM>Account Settings</TextM>
				<TextX class='text-gray-500'>Manage your account's security</TextX>
			</div>
		</div>
		<ButtonM
			Icon={ChevronRight}
			class='px-1 py-0'
			onclick={() => openAccountSettings = true}
		/>
	</div>
</div>

<Modal
	onExit={() => profileEditOn = false}
	bind:show={openProfileSettings}
	heading={profileEditOn ? 'Edit Profile': 'My Profile'}
	class='min-w-2/5 h-fit max-h-full overflow-auto scrollbar'
>
	<div class="flex flex-col items-stretch">
		<TextS class='font-bold text-gray-700/80'>Basic Information</TextS>
		<InputText
			label='Name'
			readOnly={!profileEditOn}
			maxLength={255}
			bind:value={profileInfo.name.value}
			bind:error={profileInfo.name.error}
			onInput={validateName}
		/>
		<InputText
			label='Address'
			readOnly={!profileEditOn}
			maxLength={512}
			bind:value={profileInfo.address.value}
			bind:error={profileInfo.address.error}
			onInput={validateAddress}
		/>
		<LogoUpload profile={$user} editOn={profileEditOn}/>

		<TextS class='font-bold text-gray-700/80 my-2'>PESO Requirements</TextS>

		{#if profileEditOn}
			<TextS class='text-yellow-500 bg-yellow-50 p-4 border border-yellow-200 mb-4 rounded-lg'><strong>Note:</strong> Updating any of the following requirements will place your account <strong>under review</strong> and temporarily suspend your ability to manage job posts until re-verified by PESO Staff.</TextS>
		{/if}

		<div class="space-y-2 mb-4">
			<Requirement profile={$user} editOn={profileEditOn} reqDisplay='Company Profile' reqKey='req_company_profile'/>
			<Requirement profile={$user} editOn={profileEditOn} reqDisplay='Business Permit' reqKey='req_business_permit'/>
			<Requirement profile={$user} editOn={profileEditOn} reqDisplay='SEC' reqKey='req_sec'/>
			<Requirement profile={$user} editOn={profileEditOn} reqDisplay='DTI / CDA Reg.' reqKey='req_dti_cda'/>
			<Requirement profile={$user} editOn={profileEditOn} reqDisplay='Registry of Establishment fr. DOLE' reqKey='req_reg_of_est'/>
			<Requirement profile={$user} editOn={profileEditOn} reqDisplay='Certification from DOLE Provincial Office' reqKey='req_cert_from_dole'/>
			<Requirement profile={$user} editOn={profileEditOn} reqDisplay='Certification of No Pending Case' reqKey='req_cert_no_case'/>
			<Requirement profile={$user} editOn={profileEditOn} reqDisplay='Phil-JobNet Reg.' reqKey='req_philjobnet_reg'/>
			<Requirement profile={$user} editOn={profileEditOn} reqDisplay='List of Vacancies' reqKey='req_list_of_vacancies'/>
		</div>
		
		{#if profileEditOn}
			<ButtonM
				Icon={Check}
				label='Save Changes'
				onclick={validateAndSubmit}
			/>
		{:else}			
			<ButtonM
				Icon={Pen}
				label='Edit'
				onclick={() => profileEditOn = true}
			/>
		{/if}
	</div>
</Modal>

<Modal
	onExit={() => {
		passwordEditOn = false;
	}}
	bind:show={openAccountSettings}
	heading={passwordEditOn ? 'Update Password' : 'Account Settings'}
	class='min-w-2/5 h-full relative'
>
	{#if passwordEditOn}
		<div class="flex flex-col items-stretch">
			<InputText label='Current Password'/>
			<InputText label='New Password'/>
			<InputText label='Re-type New Password'/>
			<ButtonM
				Icon={Check}
				label='Save Changes'
				onclick={() => passwordEditOn = false}
				class='absolute left-6 bottom-6 w-[calc(100%-48px)]'
			/>
		</div>
	{:else}
		<div class="flex flex-col items-stretch gap-y-4 pt-2">
			<div class="flex items-center justify-between gap-x-4 p-4 hover:bg-gray-50 transition-colors">
				<div class="flex items-center gap-x-4">
					<div class="w-8 h-8 bg-gray-50 border border-gray-100 rounded flex items-center justify-center">
						<Lock class='min-w-4 max-w-4 text-gray-600'/>
					</div>
					<TextS>Update Password</TextS>
				</div>
				<ButtonM
					Icon={ChevronRight}
					class='px-1 py-0'
					onclick={() => passwordEditOn = true}
				/>
			</div>
		</div>
	{/if}
</Modal>