<script>
	import ButtonM from "$lib/components/global/ButtonM.svelte";
	import InputPass from "$lib/components/global/InputPass.svelte";
	import InputText from "$lib/components/global/InputText.svelte";
	import Modal from "$lib/components/global/modals/Modal.svelte";
	import RoundedCard from "$lib/components/global/RoundedCard.svelte";
	import TextM from "$lib/components/global/TextM.svelte";
	import TextS from "$lib/components/global/TextS.svelte";
	import TextX from "$lib/components/global/TextX.svelte";
	import AdminHeader from "$lib/components/user/AdminHeader.svelte";
	import { user } from "$lib/stores/user";
	import { apiUrl, patchJson } from "$lib/utils/api";
	import { error, formatDate, success } from "$lib/utils/ui";
	import { Check, ChevronRight, Link, Lock, Pen, Shield, User } from "lucide-svelte";
	import { onMount } from "svelte";

	let profileInfo = $state({
		first_name: { value: '', error: '' },
		middle_name: { value: '', error: '' },
		last_name: { value: '', error: '' },
	});
	
	let openProfileSettings = $state(false);
	let profileEditOn = $state(false);

	let openAccountSettings = $state(false);
	let passwordEditOn = $state(false);

	let password = $state({
		current_password: { value: '', error: '' },
		new_password: { value: '', error: '' },
		confirm_password: { value: '', error: '' },
	});

	function validateFirstName(value) {
		let val = String(value).trim();

		if (!val)
			profileInfo.first_name.error = 'First name is required';
		else if (val.length > 50)
			profileInfo.first_name.error = 'First name must not exceed 50 characters';
		else
			profileInfo.first_name.error = '';
	}

	function validateMiddleName(value) {
		let val = String(value).trim();

		if (val.length > 50)
			profileInfo.middle_name.error = 'Middle name must not exceed 50 characters';
		else
			profileInfo.middle_name.error = '';
	}

	function validateLastName(value) {
		let val = String(value).trim();

		if (!val)
			profileInfo.last_name.error = 'Last name is required';
		else if (val.length > 50)
			profileInfo.last_name.error = 'Last name must not exceed 50 characters';
		else
			profileInfo.last_name.error = '';
	}

	async function validateAndSaveProfile() {
		validateFirstName(profileInfo.first_name.value);
		validateMiddleName(profileInfo.middle_name.value);
		validateLastName(profileInfo.last_name.value);

		if (
			profileInfo.first_name.error ||
			profileInfo.middle_name.error ||
			profileInfo.last_name.error
		) {
			error('Cannot save changes yet.');
			return;
		}

		await patchJson('/api/user/system-admin/edit-profile',
			{
				first_name: profileInfo.first_name.value,
				middle_name: profileInfo.middle_name.value,
				last_name: profileInfo.last_name.value,
			},
			{
				onSuccess: async (data) => {
					profileEditOn = false;
					user.set(data);
					success('Profile information has been updated.');
				},
				onFail: async (data) => error(data?.message ?? 'Unable to edit profile due to an error.'),
			}
		);
	}

	function loadLocalProfile() {
		profileInfo.first_name.value = $user.profile.first_name;
		profileInfo.middle_name.value = $user.profile.middle_name;
		profileInfo.last_name.value = $user.profile.last_name;
	}

	function validateCurrPass(value) {
		const val = String(value)

		if (val.length === 0)
			password.current_password.error = 'Password is required.';
		else if (val.length < 8)
			password.current_password.error = 'Password must have at least 8 characters.';
		else if (val.length > 65)
			password.current_password.error = 'Password must not exceed 65 characters.';
		else 
			password.current_password.error = '';
	}

	function validateNewPass(value) {
		const val = String(value)

		if (val.length === 0)
			password.new_password.error = 'Password is required.';
		else if (val.length < 8)
			password.new_password.error = 'Password must have at least 8 characters.';
		else if (val.length > 65)
			password.new_password.error = 'Password must not exceed 65 characters.';
		else if (val === password.current_password.value)
			password.new_password.error = 'Password must be different to the current password.';
		else 
			password.new_password.error = '';
	}

	function validateConfirmPass(value) {
		const val = String(value)

		if (val.length === 0)
			password.confirm_password.error = 'Password is required.';
		else if (val.length < 8)
			password.confirm_password.error = 'Password must have at least 8 characters.';
		else if (val.length > 65)
			password.confirm_password.error = 'Password must not exceed 65 characters.';
		else if (val !== password.new_password.value)
			password.confirm_password.error = 'Passwords do not match.';
		else 
			password.confirm_password.error = '';
	}

	async function validateAndSubmitUpdatedPass() {
		validateCurrPass(password.current_password.value);
		validateNewPass(password.new_password.value);
		validateConfirmPass(password.confirm_password.value);

		if (
			password.current_password.error ||
			password.new_password.error ||
			password.confirm_password.error
		) {
			error('Cannot update password yet');
			return;
		}

		await patchJson('/api/user/update-password',
			{
				current_password: password.current_password.value,
				new_password: password.new_password.value,
			},
			{
				onSuccess: async (_data) => {
					password = {
						current_password: { value: '', error: '' },
						new_password: { value: '', error: '' },
						confirm_password: { value: '', error: '' },
					};
					passwordEditOn = false;
					success(_data?.message ?? 'Password has been updated.')	;
				},
				onFail: async (err) => error(err?.message ?? 'Unable to update password due to an error.'),
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
	onExit={() => {
		profileEditOn = false;
	}}
	bind:show={openProfileSettings}
	heading={profileEditOn ? 'Edit Profile': 'My Profile'}
	class='min-w-2/5 h-full relative'
>
	<div class="flex flex-col items-stretch">
		<InputText
			label='First Name'
			readOnly={!profileEditOn}
			bind:value={profileInfo.first_name.value}
			bind:error={profileInfo.first_name.error}
			onInput={validateFirstName}
		/>
		<InputText
			label={`Middle Name ${profileEditOn ? '(leave blank if not applicable)' : ''}`}
			readOnly={!profileEditOn}
			bind:value={profileInfo.middle_name.value}
			bind:error={profileInfo.middle_name.error}
			onInput={validateMiddleName}
		/>
		<InputText
			label='Last Name'
			readOnly={!profileEditOn}
			bind:value={profileInfo.last_name.value}
			bind:error={profileInfo.last_name.error}
			onInput={validateLastName}
		/>
		{#if profileEditOn}
			<ButtonM
				Icon={Check}
				label='Save Changes'
				onclick={validateAndSaveProfile}
				class='absolute left-6 bottom-6 w-[calc(100%-48px)]'
			/>
		{:else}			
			<ButtonM
				Icon={Pen}
				label='Edit'
				onclick={() => profileEditOn = true}
				class='absolute left-6 bottom-6 w-[calc(100%-48px)]'
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
			<InputPass
				label='Current Password'
				bind:value={password.current_password.value}
				bind:error={password.current_password.error}
				placeholder='enter your current password'
				maxLength={65}
				onInput={validateCurrPass}
			/>
			<InputPass
				label='New Password'
				bind:value={password.new_password.value}
				bind:error={password.new_password.error}
				placeholder='enter your new password'
				maxLength={65}
				onInput={validateNewPass}
			/>
			<InputPass
				label='Re-type Password'
				bind:value={password.confirm_password.value}
				bind:error={password.confirm_password.error}
				placeholder='re-type your new password'
				maxLength={65}
				onInput={validateConfirmPass}
			/>
			<ButtonM
				Icon={Check}
				label='Update'
				onclick={validateAndSubmitUpdatedPass}
				class='absolute left-6 bottom-6 w-[calc(100%-48px)]'
			/>
		</div>
	{:else}
		<div class="flex flex-col items-stretch gap-y-4 pt-2">
			<div class="flex items-center justify-between gap-x-4">
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