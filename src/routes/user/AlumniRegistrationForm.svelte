<script>
	import { goto } from "$app/navigation";
	import BaseContainer from "$lib/components/global/BaseContainer.svelte";
	import ButtonM from "$lib/components/global/ButtonM.svelte";
	import Dropdown from "$lib/components/global/Dropdown.svelte";
	import DropdownItem from "$lib/components/global/DropdownItem.svelte";
	import InputText from "$lib/components/global/InputText.svelte";
	import RoundedCard from "$lib/components/global/RoundedCard.svelte";
	import TextM from "$lib/components/global/TextM.svelte";
	import TextS from "$lib/components/global/TextS.svelte";
	import { get } from "$lib/utils/api";
	import { error } from "$lib/utils/ui";
	import { ChevronLeft, ChevronRight, Plus, Trash, X } from "lucide-svelte";
	import { onMount } from "svelte";
	import { twMerge } from "tailwind-merge";

    let categories = [
        'Academic Background',
        'Personal Information',
        'Contact & Professional Details',
        'Profile Attachments',
        'Account Credentials'
    ];
    let categIndex = $state(0);
    let categMaxIndex = $derived(categories.length - 1);
    let categCurrent = $derived(categories[categIndex]);

    let data = $state({
        student_number: { value: null, error: '' },
        course_id: { value: 0, error: '' },
        graduation_year: { value: (new Date()).getFullYear(), error: '' },

        first_name: { value: '', error: '' },
        middle_name: { value: null, error: '' },
        last_name: { value: '', error: '' },
        name_extension: { value: null, error: '' },
        gender: { value: 'Male', error: '' },
        birth_date: { value: null, error: '' },
        birth_place: { value: '', error: '' },
        civil_status: { value: 'Single', error: '' },
        
        phone_number: { value: '', error: '' },
        address: { value: '', error: '' },
        social_medias: { value: [], error: '' },
        employment_status: { value: 'Unemployed', error: '' },
        occupations: { value: [], error: '' },

        profile_picture: { value: null, error: '' },
        cv: { value: null, error: '' },

        email: { value: '', error: '' },
        password: { value: '', error: '' },
        password_confirmed: { value: '', error: '' },
    });

    let courses = $state([]);
    let coursesLoading = $state(false);

    let socialData = $state({
        platform: { value: '', error: '' },
        url: { value: '', error: '' },
    });
    let platforms = $state([]);
    let platformsLoading = $state(false);

    function validateStudentNumber(value) {
        let val = value.trim();

        if (val.length === 0) {
            data.student_number.error = '';
            return;
        }
        
        if (!(/^\d+$/.test(val)))
            data.student_number.error = 'Student number must be numeric'
        else if (val.length > 20)
            data.student_number.error = 'Student number must not exceed 20 characters';
        else
            data.student_number.error = '';
    }

    function validateFirstName(value) {
        let val = value.trim();

        if (val.length === 0)
            data.first_name.error = 'First name is required.';
        else if (val.length > 50)
            data.first_name.error = 'First name must not exceed 50 characters';
        else
            data.first_name.error = '';
    }

    function validateMiddleName(value) {
        let val = value.trim();

        if (val.length === 0) {
            data.middle_name.error = '';
            return;
        }

        if (val.length > 50)
            data.middle_name.error = 'Middle name must not exceed 50 characters';
        else
            data.middle_name.error = '';
    }

    function validateLastName(value) {
        let val = value.trim();

        if (val.length === 0)
            data.last_name.error = 'Last name is required.';
        else if (val.length > 50)
            data.last_name.error = 'Last name must not exceed 50 characters';
        else
            data.last_name.error = '';
    }

    function validateNameExtension(value) {
        let val = value.trim();

        if (val.length === 0) {
            data.name_extension.error = '';
            return;
        }

        if (val.length > 10)
            data.name_extension.error = 'Name extension must not exceed 10 characters';
        else
            data.name_extension.error = '';
    }

    function validateBirthDate(value) {
        if (!value) {
            data.birth_date.error = 'Birth date is required.';
            return;
        }
        
        const birth = new Date(value);
        const today = new Date();

        const age = today.getFullYear() - birth.getFullYear();
        const hasHadBirthdayThisYear =
            today.getMonth() > birth.getMonth() ||
            (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
        const actualAge = hasHadBirthdayThisYear ? age : age - 1;

        if (actualAge < 21)
            data.birth_date.error = 'You must be at least 21 years old.';
        else
            data.birth_date.error = '';
    }

    function validateBirthPlace(value) {
        let val = value.trim();

        if (val.length === 0)
            data.birth_place.error = 'Birth place is required.';
        else if (val.length > 512)
            data.birth_place.error = 'Birth place must not exceed 512 characters';
        else
            data.birth_place.error = '';
    }

    function validatePhoneNumber(value) {
        let val = value.trim();

        if (val.length === 0) {
            data.phone_number.error = 'Phone number is required.';
        } else if (val.length < 8) {
            data.phone_number.error = 'Phone number must have at least 8 characters';
        } else if (val.length > 25) {
            data.phone_number.error = 'Phone number must not exceed 25 characters';
        } else {
            data.phone_number.error = '';
            data.phone_number.value = data.phone_number.value.replace(/\D/g, '');
        }
    }

    function validateAddress(value) {
        let val = value.trim();

        if (val.length === 0)
            data.address.error = 'Address is required.';
        else if (val.length > 512)
            data.address.error = 'Address must not exceed 512 characters';
        else
            data.address.error = '';
    }

    function validatePlatform(value) {
        let val = value.trim();

        if (val.length === 0)
            socialData.platform.error = 'Platform is required.';
        else if (val.length > 25)
            socialData.platform.error = 'Platform must not exceed 25 characters';
        else
            socialData.platform.error = '';
    }

    function validateURL(value) {
        let val = value.trim();

        if (val.length === 0)
            socialData.url.error = 'URL is required.';
        else if (val.length > 512)
            socialData.url.error = 'URL must not exceed 512 characters';
        else
            socialData.url.error = '';
    }

    onMount(async () => {
        await get('/api/institution/course/all', {
            onSuccess: async (_data) => {
                courses = _data;

                if (_data.length > 0) data.course_id.value = _data[0].id;
            },
            onStart: () => coursesLoading = true,
            onFinish: () => coursesLoading = false,
            onFail: async (err) => error(err?.message ?? 'Unable to fetch courses.')
        });
        await get('/api/social-media/platforms', {
            onSuccess: async (_data) => {
                if (_data.length > 0)
                    platforms = _data.map((d) => d.name);

                console.log(data);
            },
            onStart: () => platformsLoading = true,
            onFinish: () => platformsLoading = false,
            onFail: async (err) => error(err?.message ?? 'Unable to fetch social media platforms.')
        });
    });
</script>

<BaseContainer withBgImage={true} class="animate-bg">
    <div class={twMerge(
        "bg-white/50 w-full h-full max-h-full overflow-auto scrollbar p-8",
        !['Personal Information', 'Contact & Professional Details'].includes(categCurrent) && 'flex items-center justify-center'
    )}>
        <RoundedCard class={twMerge(
            "p-8 pb-6 md:w-1/3 rounded-xl flex flex-col items-stretch gap-y-5",
            ['Personal Information', 'Contact & Professional Details'].includes(categCurrent) && 'mx-auto'
        )}>
            <div class="flex flex-col items-stretch gap-y-4">
                <TextM>{categCurrent}</TextM>
                <div>
                    {#if categCurrent === 'Academic Background'}
                        {#if !coursesLoading}
                            <InputText
                                label='Student Number (Optional)'
                                maxLength={20}
                                bind:value={data.student_number.value}
                                bind:error={data.student_number.error}
                                onInput={validateStudentNumber}
                            />
                            <Dropdown
                                label='Course'
                                bind:value={data.course_id.value}
                                bind:error={data.course_id.error}
                            >
                                {#each courses as course}
                                    <DropdownItem value={course.id} label={course.name}/>
                                {/each}
                            </Dropdown>
                            <Dropdown
                                label='Batch'
                                bind:value={data.graduation_year.value}
                            >
                                {#each Array.from({ length: (new Date()).getFullYear() - 2006 }, (_, i) => i + 2007).reverse() as year}
                                    <DropdownItem value={year} label={year}/>
                                {/each}
                            </Dropdown>
                        {/if}
                    {:else if categCurrent === 'Personal Information'}
                            <InputText
                                label='First Name'
                                minLength={1}
                                maxLength={50}
                                bind:value={data.first_name.value}
                                bind:error={data.first_name.error}
                                onInput={validateFirstName}
                            />
                            <InputText
                                label='Middle Name (leave blank if not applicable)'
                                maxLength={50}
                                bind:value={data.middle_name.value}
                                bind:error={data.middle_name.error}
                                onInput={validateMiddleName}
                            />
                            <InputText
                                label='Last Name'
                                minLength={1}
                                maxLength={50}
                                bind:value={data.last_name.value}
                                bind:error={data.last_name.error}
                                onInput={validateLastName}
                            />
                            <InputText
                                label='Name Extension (leave blank if not applicable)'
                                maxLength={10}
                                bind:value={data.name_extension.value}
                                bind:error={data.name_extension.error}
                                onInput={validateNameExtension}
                            />
                            <Dropdown
                                label='Gender'
                                bind:value={data.gender.value}
                                bind:error={data.gender.error}
                            >
                                <DropdownItem value='Male' label='Male'/>
                                <DropdownItem value='Female' label='Female'/>
                            </Dropdown>
                            <div class="flex flex-col items-stretch gap-y-1 my-2">
                                <TextS class='text-gray-500'>Birth Date</TextS>

                                <input
                                    bind:value={data.birth_date.value}
                                    required={true}
                                    type="date"
                                    class="bg-gray-50 border border-gray-200 w-full text-sm py-3 rounded"
                                    onchange={(e) => validateBirthDate(e.target.value)}
                                >

                                {#if data.birth_date.error}
                                    <TextS class='text-red-500'>{data.birth_date.error}</TextS>
                                {/if}
                            </div>
                            <InputText
                                label='Birth Place'
                                minLength={1}
                                maxLength={50}
                                bind:value={data.birth_place.value}
                                bind:error={data.birth_place.error}
                                onInput={validateBirthPlace}
                            />
                            <Dropdown
                                label='Civil Status'
                                bind:value={data.civil_status.value}
                                bind:error={data.civil_status.error}
                            >
                                <DropdownItem value='Single' label='Single'/>
                                <DropdownItem value='Married' label='Married'/>
                                <DropdownItem value='Widowed' label='Widowed'/>
                                <DropdownItem value='Separated' label='Separated'/>
                            </Dropdown>
                    {:else if categCurrent === 'Contact & Professional Details'}
                        {#if !platformsLoading}
                            <InputText
                                label='Phone Number'
                                minLength={8}
                                maxLength={25}
                                bind:value={data.phone_number.value}
                                bind:error={data.phone_number.error}
                                onInput={validatePhoneNumber}
                            />
                            <InputText
                                label='Address'
                                minLength={1}
                                maxLength={512}
                                bind:value={data.address.value}
                                bind:error={data.address.error}
                                onInput={validateAddress}
                            />

                            <div class="flex flex-col items-stretch">
                                <TextS>Socials</TextS>
                                {#if data.social_medias.value.length > 0}
                                    <div class="flex flex-col gap-y-2">
                                        {#each data.social_medias.value as social}
                                            <div class="grow flex items-center gap-x-2 overflow-hidden">
                                                <div class="grow flex items-center gap-x-2 overflow-hidden">
                                                    <TextS class='basis-1/3 shrink-0 truncate'>{social.platform.value}</TextS>
                                                    <TextS class='basis-2/3 min-w-0 truncate'>{social.url.value}</TextS>
                                                </div>
                                                <ButtonM
                                                    Icon={Trash}
                                                    class='px-1 py-0 bg-red-500 shrink-0'
                                                    onclick={() => data.social_medias.value = data.social_medias.value.filter((s) => s !== social)}
                                                />
                                            </div>
                                        {/each}
                                    </div>
                                {:else}
                                    <TextS class='mt-2'>No socials were added yet.</TextS>
                                {/if}
                                <div class="flex flex-col items-stretch">
                                    <datalist id="platforms">
                                        {#each platforms as platform}
                                            <option value={platform}></option>
                                        {/each}
                                    </datalist>
                                    <InputText
                                        label='Platform'
                                        list='platforms'
                                        maxLength={25}
                                        bind:value={socialData.platform.value}
                                        bind:error={socialData.platform.error}
                                        onInput={validatePlatform}
                                    />
                                    <InputText
                                        label='URL'
                                        maxLength={512}
                                        bind:value={socialData.url.value}
                                        bind:error={socialData.url.error}
                                        onInput={validateURL}
                                    />
                                    <ButtonM
                                        Icon={Plus}
                                        label='Add Social'
                                        class='mt-2'
                                        onclick={() => {
                                            validatePlatform(socialData.platform.value);
                                            validateURL(socialData.url.value);

                                            if (socialData.platform.error || socialData.url.error) {
                                                error('Cannot add the social yet.');
                                                return;
                                            }

                                            data.social_medias.value = [...data.social_medias.value, socialData];
                                            socialData = {
                                                platform: { value: '', error: '' },
                                                url: { value: '', error: '' },
                                            };
                                        }}
                                    />
                                </div>
                            </div>

                            <Dropdown
                                label='Employment Status'
                                bind:value={data.employment_status.value}
                                bind:error={data.employment_status.error}
                            >
                                <DropdownItem value='Employed' label='Employed'/>
                                <DropdownItem value='Self-employed' label='Self-employed'/>
                                <DropdownItem value='Unemployed' label='Unemployed'/>
                            </Dropdown>
                            
                            
                        {/if}
                    {:else if categCurrent === 'Profile Attachments'}
                    {:else}
                    {/if}
                </div>
            </div>
            <div class="grid grid-cols-2 gap-x-4">
                {#if categIndex === 0}
                    <ButtonM
                        Icon={X}
                        label='Cancel'
                        onclick={() => goto('/registration')}
                        class='bg-red-500'
                    />
                {/if}
                {#if categIndex > 0}
                    <ButtonM
                        Icon={ChevronLeft}
                        label='Previous'
                        onclick={() => categIndex--}
                    />
                {/if}
                {#if categIndex < categMaxIndex}
                    <ButtonM
                        Icon={ChevronRight}
                        label={'Next'}
                        iconRight={true}
                        onclick={() => categIndex++}
                    />
                {/if}
                {#if categIndex === categMaxIndex}
                    <ButtonM
                        Icon={ChevronRight}
                        label={'Proceed'}
                        iconRight={true}
                        onclick={() => {}}
                    />
                {/if}
            </div>
        </RoundedCard>
    </div>
</BaseContainer>