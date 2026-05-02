<script>
	import { goto } from "$app/navigation";
	import ButtonM from "$lib/components/global/ButtonM.svelte";
	import Dropdown from "$lib/components/global/Dropdown.svelte";
	import DropdownItem from "$lib/components/global/DropdownItem.svelte";
	import InputNumber from "$lib/components/global/InputNumber.svelte";
	import InputPass from "$lib/components/global/InputPass.svelte";
	import InputText from "$lib/components/global/InputText.svelte";
	import Modal from "$lib/components/global/modals/Modal.svelte";
	import RoundedCard from "$lib/components/global/RoundedCard.svelte";
	import TextM from "$lib/components/global/TextM.svelte";
	import TextS from "$lib/components/global/TextS.svelte";
	import TextX from "$lib/components/global/TextX.svelte";
	import AdminHeader from "$lib/components/user/AdminHeader.svelte";
	import CvUpload from "$lib/components/user/CvUpload.svelte";
	import ProfilePictureUpload from "$lib/components/user/ProfilePictureUpload.svelte";
	import { user } from "$lib/stores/user";
	import { apiUrl, deleteJson, get, patchJson, postJson } from "$lib/utils/api";
	import { error, formatDate, success } from "$lib/utils/ui";
	import { Briefcase, Check, ChevronLeft, ChevronRight, Link, Lock, Pen, Plus, Save, Shield, Trash, User, X } from "lucide-svelte";
	import { onMount } from "svelte";
	import { twMerge } from "tailwind-merge";

	let openProfileSettings = $state(false);
	let profileEditOn = $state(false);

	let openAccountSettings = $state(false);
	let passwordEditOn = $state(false);

	let contactInfo = $state({
		phone_number: { value: '', error: '' },
		address: { value: '', error: '' },
	});
	
	let civil_status = $state({ value: '', error: '' });
	let employment_status = $state({ value: 'Employed', error: '' });
	let occupations = $state({ value: [], error: '' });
	let social_medias = $state({ value: [], error: '' });

	let existingOccupations = $state([]);
	let existingPlatforms = $state([]);

	let occupation = $state({
		company: { value: '', error: '' },
		name: { value: '', error: '' },
		address: { value: '', error: '' },
		is_current: { value: true, error: '' },
		start_year: { value: (new Date()).getFullYear(), error: '' },
		end_year: { value: null, error: '' },
	});

	let social = $state({
		platform: { value: '', error: '' },
		url: { value: '', error: '' }
	});

	let password = $state({
		current_password: { value: '', error: '' },
		new_password: { value: '', error: '' },
		confirm_password: { value: '', error: '' },
	});
	
	async function loadProfile() {
		await get('/api/auth/me', {
            onSuccess: async (data) => {
                user.set(data);

				contactInfo.phone_number.value = $user.profile.phone_number;
				contactInfo.address.value = $user.profile.address;

				civil_status.value = $user.profile.civil_status;
				employment_status.value = $user.profile.employment_status;
				occupations.value = $user.profile.occupations.map((o) => ({
					...o,
					editOn: false,
					edit: {
						name: { value: o.occupation.name, error: '' },
						company: { value: o.company, error: '' },
						address: { value: o.address, error: '' },
						is_current: o.is_current,
						start_year: { value: o.start_year, error: '' },
						end_year: { value: o.end_year, error: '' },
					}
				}));
				
				social_medias.value = $user.profile.social_medias.map((s) => ({
					...s,
					editOn: false,
					edit: {
						platform: { value: s.platform.name, error: '' },
						url: { value: s.url, error: '' },
					}
				}));
				
				console.log(social_medias.value);
            },
            onFail: async (data, status) => {
                if (status === 400) goto('/', { replaceState: true });
                
                error(data?.message ?? 'An unknown error has occurred.');
            },
        });
	}

	async function onDeleteOccupationState(id) {
		await deleteJson(`/api/occupation-state/delete/${id}`, null, {
			onSuccess: async (_data) => {
				await loadProfile();
				success(_data?.message ?? 'Occupation has been deleted.');
			},
			onFail: async (err) => error(err?.message ?? 'Unable to delete occupation due to an error.'),
		});
	}

	function validatePhoneNumber(value) {
        let val = value.trim();

        if (val.length === 0) {
            contactInfo.phone_number.error = 'Phone number is required.';
        } else if (val.length < 8) {
            contactInfo.phone_number.error = 'Phone number must have at least 8 characters';
        } else if (val.length > 25) {
            contactInfo.phone_number.error = 'Phone number must not exceed 25 characters';
        } else {
            contactInfo.phone_number.error = '';
            contactInfo.phone_number.value = contactInfo.phone_number.value.replace(/\D/g, '');
        }
    }

	function validateAddress(value) {
        let val = value.trim();

        if (val.length === 0)
            contactInfo.address.error = 'Address is required.';
        else if (val.length > 512)
            contactInfo.address.error = 'Address must not exceed 512 characters';
        else
            contactInfo.address.error = '';
    }

	function validateEmpStat(value) {
		const isUnemployed = occupations.value.every((o) => !o.edit.is_current);
		
		if (value === 'Unemployed' && !isUnemployed) {
			error('Setting your employment status to unemployed requires you to not have a current job.');
			return;
		}
	}

	async function validateCompany(value) {
		const val = String(value).trim();

		if (val.length === 0)
			occupation.company.error = 'Company name is required.';
		else if (val.length > 512)
			occupation.company.error = 'Company name must be at most 512 characters.';
		else
			occupation.company.error = '';
	}

	async function validateCompanyAddress(value) {
		const val = String(value).trim();

		if (val.length === 0)
			occupation.address.error = 'Company address is required.';
		else if (val.length > 512)
			occupation.address.error = 'Company address must be at most 512 characters.';
		else
			occupation.address.error = '';
	}

	async function validateName(value) {
		const val = String(value).trim();

		if (val.length === 0)
			occupation.name.error = 'Occupation name is required.';
		else if (val.length > 255)
			occupation.name.error = 'Occupation name must be at most 255 characters.';
		else
			occupation.name.error = '';
	}

	async function validateStartYear(value) {
		const val = String(value).trim();

		if (val.length === 0)
			occupation.start_year.error = 'Start year is required.';
		else if (value < (new Date($user.profile.birth_date)).getFullYear())
			occupation.start_year.error = 'Invalid start year.';
		else if (!occupation.is_current.value && occupation.end_year.value && value > occupation.end_year.value)
			occupation.start_year.error = 'Start year must be earlier or equal to end year.';
		else
			occupation.start_year.error = '';
	}

	async function validateEndYear(value) {
		if (occupation.is_current.value)
			return;
		
		const val = String(value).trim();

		if (val.length === 0)
			occupation.end_year.error = 'End year is required.';
		else if (value < (new Date($user.profile.birth_date)).getFullYear())
			occupation.end_year.error = 'Invalid end year.';
		else if (value < occupation.start_year.value)
			occupation.end_year.error = 'End year must be later or equal to start year.';
		else
			occupation.end_year.error = '';
	}

	async function validateEditCompany(value, index) {
		const val = String(value).trim();

		if (val.length === 0)
			occupations.value[index].edit.company.error = 'Company name is required.';
		else if (val.length > 512)
			occupations.value[index].edit.company.error = 'Company name must be at most 512 characters.';
		else
			occupations.value[index].edit.company.error = '';
	}

	async function validateEditAddress(value, index) {
		const val = String(value).trim();

		if (val.length === 0)
			occupations.value[index].edit.address.error = 'Company address is required.';
		else if (val.length > 512)
			occupations.value[index].edit.address.error = 'Company address must be at most 512 characters.';
		else
			occupations.value[index].edit.address.error = '';
	}

	async function validateEditName(value, index) {
		const val = String(value).trim();

		if (val.length === 0)
			occupations.value[index].edit.name.error = 'Occupation name is required.';
		else if (val.length > 255)
			occupations.value[index].edit.name.error = 'Occupation name must be at most 255 characters.';
		else
			occupations.value[index].edit.name.error = '';
	}

	async function validateEditStartYear(value, index) {
		const val = String(value).trim();

		if (val.length === 0)
			occupations.value[index].edit.start_year.error = 'Start year is required.';
		else if (value < (new Date($user.profile.birth_date)).getFullYear())
			occupations.value[index].edit.start_year.error = 'Invalid start year.';
		else if (!occupations.value[index].edit.is_current && occupations.value[index].edit.end_year.value !== null && value > occupations.value[index].edit.end_year.value)
			occupations.value[index].edit.start_year.error = 'Start year must be earlier or equal to end year.';
		else
			occupations.value[index].edit.start_year.error = '';
	}

	async function validateEditEndYear(value, index) {
		if (occupations.value[index].edit.is_current)
			return;
		
		const val = String(value).trim();

		if (val.length === 0)
			occupations.value[index].edit.end_year.error = 'End year is required.';
		else if (value < (new Date($user.profile.birth_date)).getFullYear())
			occupations.value[index].edit.end_year.error = 'Invalid end year.';
		else if (occupations.value[index].edit.start_year.value != null && value < occupations.value[index].edit.start_year.value)
			occupations.value[index].edit.end_year.error = 'End year must be later or equal to start year.';
		else
			occupations.value[index].edit.end_year.error = '';
	}

	async function validateAndSubmitOccupation() {
		validateCompany(occupation.company.value);
		validateName(occupation.name.value);
		validateCompanyAddress(occupation.address.value);
		validateStartYear(occupation.start_year.value);
		validateEndYear(occupation.end_year.value);
		
		if (
			occupation.company.error ||
			occupation.name.error ||
			occupation.address.error ||
			occupation.start_year.error ||
			occupation.end_year.error
		) {
			error('Cannot add occupation yet.');
			return;
		}

		await postJson('/api/occupation-state',
			{
				company: occupation.company.value,
				name: occupation.name.value,
				address: occupation.address.value,
				is_current: occupation.is_current.value,
				start_year: occupation.start_year.value,
				end_year: occupation.end_year.value,
			},
			{
				onSuccess: async (_data) => {
					await loadProfile();
					success('Occupation has been added.');
				},
				onFail: async (err) => error(err?.message ?? 'Unable to add occupation due to an error.')
			}
		);
	}

	async function validateEditAndSubmitOccupation(index) {
		validateEditCompany(occupations.value[index].edit.company.value, index);
		validateEditName(occupations.value[index].edit.name.value, index);
		validateEditAddress(occupations.value[index].edit.address.value, index);
		validateEditStartYear(occupations.value[index].edit.start_year.value, index);
		validateEditEndYear(occupations.value[index].edit.end_year.value, index);
		
		if (
			occupations.value[index].edit.company.error ||
			occupations.value[index].edit.name.error ||
			occupations.value[index].edit.address.error ||
			occupations.value[index].edit.start_year.error ||
			occupations.value[index].edit.end_year.error
		) {
			error('Cannot save occupation changes yet.');
			return;
		}

		await patchJson('/api/occupation-state/' + occupations.value[index].id,
			{
				company: occupations.value[index].edit.company.value,
				name: occupations.value[index].edit.name.value,
				address: occupations.value[index].edit.address.value,
				is_current: occupations.value[index].edit.is_current,
				start_year: occupations.value[index].edit.start_year.value,
				end_year: occupations.value[index].edit.end_year.value,
			},
			{
				onSuccess: async (_data) => {
					await loadProfile();
					success('Occupation has been updated.');
				},
				onFail: async (err) => error(err?.message ?? 'Unable to update occupation due to an error.')
			}
		);
	}

	async function validateAndSubmitNewProfile() {
		validatePhoneNumber(contactInfo.phone_number.value);
		validateAddress(contactInfo.address.value);
		validateEmpStat(employment_status.value);

		if (
			contactInfo.phone_number.error ||
			contactInfo.address.error ||
			employment_status.error
		) {
			error('Cannot save changes yet.');
			return;
		}

		await patchJson('/api/user/alumni/renew-profile',
			{
				civil_status: civil_status.value,
				phone_number: contactInfo.phone_number.value,
				address: contactInfo.address.value,
				employment_status: employment_status.value
			},
			{
				onSuccess: async (_data) => {
					await loadProfile();
					profileEditOn = false;
					success('Profile has been updated!');
				},
				onFail: async (err) => error(err?.message ?? 'Unable to update profile due to an error.'),
			}
		);
	}

	async function validatePlatform(value) {
		const val = String(value).trim();

		if (val.length === 0)
			social.platform.error = 'Platform is required.';
		else if (val.length > 25)
			social.platform.error = 'Platform must not exceed 25 characters.';
		else
			social.platform.error = '';
	}

	async function validateUrl(value) {
		const val = String(value).trim();

		if (val.length === 0)
			social.url.error = 'URL is required.';
		else if (val.length > 512)
			social.url.error = 'URL must not exceed 512 characters.';
		else
			social.url.error = '';
	}

	async function validateAndSubmitSocial() {
		validatePlatform(social.platform.value);
		validateUrl(social.url.value);

		if (
			social.platform.error ||
			social.url.error
		) {
			error('Cannot add social info yet.');
			return;
		}

		await postJson('/api/social-media',
			{
				platform: social.platform.value,
				url: social.url.value,
			},
			{
				onSuccess: async (_data) => {
					social = {
						platform: { value: '', error: '' },
						url: { value: '', error: '' }
					};
					await loadProfile();
					success('Social has been added.')
				},
				onFail: async (err) => error(err?.message ?? 'Unable to add social due to an error.')
			}
		);
	}

	async function validateEditPlatform(value, index) {
		const val = String(value).trim();

		if (val.length === 0)
			social_medias.value[index].edit.platform.error = 'Platform is required.';
		else if (val.length > 25)
			social_medias.value[index].edit.platform.error = 'Platform must not exceed 25 characters.';
		else
			social_medias.value[index].edit.platform.error = '';
	}

	async function validateEditUrl(value, index) {
		const val = String(value).trim();

		if (val.length === 0)
			social_medias.value[index].edit.url.error = 'URL is required.';
		else if (val.length > 512)
			social_medias.value[index].edit.url.error = 'URL must not exceed 512 characters.';
		else
			social_medias.value[index].edit.url.error = '';
	}

	async function validateEditAndSubmitSocial(index) {
		validateEditPlatform(social_medias.value[index].edit.platform.value, index);
		validateEditUrl(social_medias.value[index].edit.url.value, index);

		if (
			social_medias.value[index].edit.platform.error ||
			social_medias.value[index].edit.url.error
		) {
			error('Cannot save social changes yet.');
			return;
		}

		await patchJson(`/api/social-media/${social_medias.value[index].id}`,
			{
				platform: social_medias.value[index].edit.platform.value,
				url: social_medias.value[index].edit.url.value
			},
			{
				onSuccess: async (_data) => {
					await loadProfile();
					success('Social has been updated.');
				},
				onFail: async (err) => error(err?.message ?? 'Unable to update social due to an error.')
			}
		);
	}

	async function onDeleteSocial(index) {
		await deleteJson(`/api/social-media/${social_medias.value[index].id}`, null, {
			onSuccess: async (_data) => {
				await loadProfile();
				success('Social has been deleted.');
			},
			onFail: async (err) => error(err?.message ?? 'Unable to delete social due to an error.')
		});
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

	onMount(async () => {
		await loadProfile();

		await get('/api/institution/occupation/all', {
            onSuccess: async (_data) => {
                if (_data.length > 0)
                    existingOccupations = _data.map((d) => d.name);
            },
            onFail: async (err) => error(err?.message ?? 'Unable to fetch occupations.')
        });

		await get('/api/social-media/platforms', {
            onSuccess: async (_data) => {
                if (_data.length > 0)
                    existingPlatforms = _data.map((d) => d.name);
            },
            onFail: async (err) => error(err?.message ?? 'Unable to fetch social media platforms.')
        });
	});
</script>

<AdminHeader heading='Settings'/>

<div class="flex-1 min-h-0 space-y-4 overflow-y-hidden px-4 pt-4 bg-white flex flex-col items-stretch">
    <div class='flex items-center justify-between'>
		<div class="flex items-center gap-x-6">
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
    <div class='flex items-center justify-between'>
		<div class="flex items-center gap-x-6">
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
	<div class="flex items-center">
		<ButtonM
			Icon={ChevronLeft}
			label='Close'
			onclick={() => goto('/user/alumni', { replaceState: true })}
		/>
	</div>
</div>

<Modal
	onExit={() => {
		profileEditOn = false;
	}}
	bind:show={openProfileSettings}
	heading='My Profile'
	class='min-w-2/5 max-h-full overflow-auto scrollbar'
>
	<div class="flex flex-col items-stretch">
		<TextS class='font-bold text-gray-700/80'>Personal Information</TextS>
		<Dropdown
			label='Civil Status'
			bind:value={civil_status.value}
		>
			<DropdownItem disabled={!profileEditOn} label='Single' value='Single'/>
			<DropdownItem disabled={!profileEditOn} label='Married' value='Married'/>
			<DropdownItem disabled={!profileEditOn} label='Widowed' value='Widowed'/>
			<DropdownItem disabled={!profileEditOn} label='Separated' value='Separated'/>
		</Dropdown>
		
		<TextS class='font-bold text-gray-700/80 mt-6 mb-2'>Contact Information</TextS>
		<InputText
			label='Phone Number'
			readOnly={!profileEditOn}
			maxLength={25}
			bind:value={contactInfo.phone_number.value}
			bind:error={contactInfo.phone_number.error}
			onInput={validatePhoneNumber}
		/>
		<InputText
			label='Address'
			readOnly={!profileEditOn}
			maxLength={512}
			bind:value={contactInfo.address.value}
			bind:error={contactInfo.address.error}
			onInput={validateAddress}
		/>

		<div class="flex flex-col items-stretch">
			<TextS class='text-gray-500 mb-2'>Socials</TextS>
			<div class="flex flex-col items-stretch gap-y-2">
				{#each social_medias.value as social, socIndex}
					{#if social.editOn}
						<div class="flex flex-col items-stretch border border-gray-200 rounded-lg px-4 py-2">
							<div class="grid grid-cols-7 gap-4">
								<datalist id="existing-platforms-edit">
									{#each existingPlatforms as platform}
										<option value={platform}></option>
									{/each}
								</datalist>
								<InputText
									label='Platform'
									placeholder='Facebook'
									list='existing-platforms-edit'
									bind:value={social_medias.value[socIndex].edit.platform.value}
									bind:error={social_medias.value[socIndex].edit.platform.error}
									onInput={() => validateEditPlatform(social_medias.value[socIndex].edit.platform.value, socIndex)}
									class='col-span-2'
								/>
								<InputText
									label='URL'
									placeholder='https://www.facebook.com/your-username'
									bind:value={social_medias.value[socIndex].edit.url.value}
									bind:error={social_medias.value[socIndex].edit.url.error}
									onInput={() => validateEditUrl(social_medias.value[socIndex].edit.url.value, socIndex)}
									class='col-span-5'
								/>
							</div>
							<div class="grid grid-cols-2 gap-x-2">
								<ButtonM
									Icon={X}
									label='Cancel'
									class='mb-2 bg-red-500'
									onclick={() => {
										social_medias.value = social_medias.value.map((s) => {
											if (s.id !== social.id)
												return s;

											return {
												...s,
												editOn: false,
												edit: {
													platform: { value: s.platform.name, error: '' },
													url: { value: s.url, error: '' },
												}
											};
										});
									}}
								/>
								<ButtonM
									Icon={Save}
									label='Save'
									onclick={async () => await validateEditAndSubmitSocial(socIndex)}
									class='mb-2'
								/>
							</div>
						</div>
					{:else}
						<div class="flex items-center gap-x-2 bg-gray-100/75 py-0.5 border border-gray-200 rounded overflow-clip pr-2">
							<div class="grid grid-cols-7">
								<input
									type="text"
									bind:value={social_medias.value[socIndex].edit.platform.value}
									class="col-span-2 border-0 bg-transparent border-r border-gray-200 text-sm"
								>
								<input
									type="text"
									bind:value={social_medias.value[socIndex].edit.url.value}
									class="col-span-5 border-0 bg-transparent text-sm"
								>
							</div>
							{#if profileEditOn}
								<div class="flex items-center gap-x-2">
									<ButtonM
										Icon={Pen}
										class='px-1 py-0'
										onclick={() => {
											social_medias.value = social_medias.value.map((s) => {
												if (s.id !== social.id)
													return s;

												return { ...s, editOn: true };
											});
										}}
									/>

									{#if social_medias.value.length > 1}
										<ButtonM
											Icon={Trash}
											onclick={async () => await onDeleteSocial(socIndex)}
											class='px-1 py-0 bg-red-500'
										/>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				{/each}
			</div>
		</div>

		{#if profileEditOn}
			<div class="flex flex-col items-stretch mt-4">
				<TextS class='text-gray-500'>Add Social</TextS>
				<div class="grid grid-cols-7 gap-4">
					<datalist id="existing-platforms">
						{#each existingPlatforms as platform}
							<option value={platform}></option>
						{/each}
					</datalist>
					<InputText
						label='Platform'
						list='existing-platforms'
						placeholder='Facebook'
						bind:value={social.platform.value}
						bind:error={social.platform.error}
						class='col-span-2'
					/>
					<InputText
						label='URL'
						placeholder='https://www.facebook.com/your-username'
						bind:value={social.url.value}
						bind:error={social.url.error}
						class='col-span-5'
					/>
				</div>
				<ButtonM
					Icon={Plus}
					label='Add'
					onclick={validateAndSubmitSocial}
					class='mb-2'
				/>
			</div>
		{/if}
		
		<TextS class='font-bold text-gray-700/80 mt-6 mb-2'>Attachments</TextS>
		<ProfilePictureUpload profile={$user} editOn={profileEditOn}/>
		<CvUpload profile={$user} editOn={profileEditOn}/>

		<TextS class='font-bold text-gray-700/80 mt-8'>Employment</TextS>

		<Dropdown
			label='Employment Status'
			onChange={(value) => {
				if (value === 'Unemployed')
					occupations.value = [...occupations.value.map((o) => ({
						...o,
						editOn: o.edit.is_current,
						...(o.edit.is_current && { edit: {
							...o.edit,
							is_current: false
						}})
					}))];
			}}
			bind:value={employment_status.value}
		>
			<DropdownItem disabled={!profileEditOn} label='Unemployed' value='Unemployed'/>
			<DropdownItem disabled={!profileEditOn} label='Self-employed' value='Self-employed'/>
			<DropdownItem disabled={!profileEditOn} label='Employed' value='Employed'/>
		</Dropdown>
		
		<div class="flex flex-col items-stretch">
			<TextS class='text-gray-500 mb-2'>Occupations</TextS>
			<div class="flex flex-col items-stretch gap-y-2">
				{#each occupations.value as occ, occIndex}
					{#if occ.editOn}
						<div class="flex flex-col items-stretch border border-gray-200 rounded-lg px-4 py-2">
							<div class="grid grid-cols-2 gap-x-4">
								<InputText
									label='Company'
									bind:value={occupations.value[occIndex].edit.company.value}
									bind:error={occupations.value[occIndex].edit.company.error}
									onInput={() => validateEditCompany(occupations.value[occIndex].edit.company.value, occIndex)}
								/>

								<datalist id="existing-occupations">
									{#each existingOccupations as occupation}
										<option value={occupation}></option>
									{/each}
								</datalist>
								<InputText
									list='existing-occupations'
									label='Occupation'
									bind:value={occupations.value[occIndex].edit.name.value}
									bind:error={occupations.value[occIndex].edit.name.error}
									onInput={() => validateEditName(occupations.value[occIndex].edit.name.value, occIndex)}
								/>
							</div>
							<label for={`current-edit-${occ.id}`} class="flex items-center gap-x-2 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={occupations.value[occIndex].edit.is_current}
									id={`current-edit-${occ.id}`}
									onchange={(e) => {
										if (e.target.checked) {
											occupations.value[occIndex].edit.end_year.value = null;
											occupations.value[occIndex].edit.start_year.error === 'Start year must be earlier or equal to end year.'
												? occupations.value[occIndex].edit.start_year.error = ''
												: occupations.value[occIndex].edit.start_year.error;
										}
									}}
									class="rounded"
								>
								<TextS>I still work here</TextS>
							</label>
							<InputText
								label='Address'
								bind:value={occupations.value[occIndex].edit.address.value}
								bind:error={occupations.value[occIndex].edit.address.error}
								onInput={() => validateEditAddress(occupations.value[occIndex].edit.address.value, occIndex)}
							/>
							<div class="grid grid-cols-2 gap-x-4">
								<InputNumber
									label='Year Started'
									bind:value={occupations.value[occIndex].edit.start_year.value}
									bind:error={occupations.value[occIndex].edit.start_year.error}
									onInput={() => validateEditStartYear(occupations.value[occIndex].edit.start_year.value, occIndex)}
									class={occupations.value[occIndex].edit.is_current && 'col-span-2'}
								/>
								{#if !occupations.value[occIndex].edit.is_current}
									<InputNumber
										label='Year Ended'
										bind:value={occupations.value[occIndex].edit.end_year.value}
										bind:error={occupations.value[occIndex].edit.end_year.error}
										onInput={() => validateEditEndYear(occupations.value[occIndex].edit.end_year.value, occIndex)}
									/>
								{/if}
							</div>
							<div class="grid grid-cols-2 gap-x-2">
								<ButtonM
									Icon={X}
									label='Cancel'
									onclick={() => occupations.value = [ ...occupations.value.map((o) => {
										if (o.id !== occ.id)
											return o;

										return {
											...o,
											editOn: false,
											edit: {
												name: { value: o.occupation.name, error: '' },
												company: { value: o.company, error: '' },
												address: { value: o.address, error: '' },
												is_current: o.is_current,
												start_year: { value: o.start_year, error: '' },
												end_year: { value: o.end_year, error: '' },
											}
										}
									}) ]}
									class='mb-2 bg-red-500'
								/>
								<ButtonM
									Icon={Save}
									label='Save'
									onclick={async () => await validateEditAndSubmitOccupation(occIndex)}
									class='mb-2'
								/>
							</div>
						</div>
					{:else}
						<div class="flex items-center justify-between gap-x-2">
							<div class="flex items-start gap-x-4">
								<div class="bg-gray-100 border border-gray-200 w-8 h-8 rounded-sm flex items-center justify-center mt-1">
									<Briefcase class='w-4 text-gray-400'/>
								</div>
								<div class="flex flex-col items-stretch">
									<input
										type="text"
										value={occ.occupation.name}
										class="border-0 bg-transparent text-sm indent-0 p-0 font-bold text-gray-600/90"
									>
									<TextX>{occ.start_year}{occ.end_year ? ' - ' + occ.end_year : ' - Present'} at <strong>{occ.company}</strong></TextX>
									<TextX>{occ.address}</TextX>
								</div>
							</div>
							<div class="flex items-center gap-x-2">
								{#if profileEditOn}
									<ButtonM
										Icon={Pen}
										onclick={() => occupations.value = [ ...occupations.value.map((o) => {
											if (o.id !== occ.id)
												return o;

											return { ...o, editOn: true };
										}) ]}
										class='px-1 py-0'
									/>

									{#if occupations.value.length > 1}
										<ButtonM
											Icon={Trash}
											onclick={async () => await onDeleteOccupationState(occ.id)}
											class='px-1 py-0 bg-red-500'
										/>
									{/if}
								{/if}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</div>

		{#if profileEditOn}
			<div class="flex flex-col items-stretch mt-2">
				<TextS class='text-gray-500'>Add Occupation</TextS>
				<div class="grid grid-cols-2 gap-x-4">
					<InputText
						label='Company'
						bind:value={occupation.company.value}
						bind:error={occupation.company.error}
						onInput={validateCompany}
					/>

					<datalist id="existing-occupations">
						{#each existingOccupations as occupation}
							<option value={occupation}></option>
						{/each}
					</datalist>
					<InputText
						list='existing-occupations'
						label='Occupation'
						bind:value={occupation.name.value}
						bind:error={occupation.name.error}
						onInput={validateName}
					/>
				</div>
				<label for="current" class="flex items-center gap-x-2 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={occupation.is_current.value}
						id="current"
						class="rounded"
					>
					<TextS>I still work here</TextS>
				</label>
				<InputText
					label='Address'
					bind:value={occupation.address.value}
					bind:error={occupation.address.error}
					onInput={validateCompanyAddress}
				/>
				<div class="grid grid-cols-2 gap-x-4">
					<InputNumber
						label='Year Started'
						bind:value={occupation.start_year.value}
						bind:error={occupation.start_year.error}
						onInput={validateStartYear}
						class={occupation.is_current.value && 'col-span-2'}
					/>
					{#if !occupation.is_current.value}
						<InputNumber
							label='Year Ended'
							bind:value={occupation.end_year.value}
							bind:error={occupation.end_year.error}
							onInput={validateEndYear}
						/>
					{/if}
				</div>
				<ButtonM
					Icon={Plus}
					label='Add'
					onclick={validateAndSubmitOccupation}
					class='mb-2'
				/>
			</div>
		{/if}

		{#if profileEditOn}
			<ButtonM
				Icon={Check}
				label='Save Changes'
				onclick={validateAndSubmitNewProfile}
				class='mt-6'
			/>
		{:else}
			<ButtonM
				Icon={Pen}
				label='Edit'
				onclick={() => profileEditOn = true}
				class='mt-6'
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
			<div class="flex items-center justify-between gap-x-4 rounded-lg">
				<div class="flex items-center gap-x-4">
					<div class="w-8 h-8 bg-gray-50 border border-gray-100 rounded flex items-center justify-center">
						<Lock class='min-w-4 max-w-4 text-gray-600'/>
					</div>
					<TextM>Update Password</TextM>
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