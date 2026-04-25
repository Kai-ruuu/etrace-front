<script>
	import { goto } from "$app/navigation";
	import BaseContainer from "$lib/components/global/BaseContainer.svelte";
	import ButtonM from "$lib/components/global/ButtonM.svelte";
	import Dropdown from "$lib/components/global/Dropdown.svelte";
	import DropdownItem from "$lib/components/global/DropdownItem.svelte";
	import InputFile from "$lib/components/global/InputFile.svelte";
	import InputPass from "$lib/components/global/InputPass.svelte";
	import InputText from "$lib/components/global/InputText.svelte";
	import RoundedCard from "$lib/components/global/RoundedCard.svelte";
	import TextM from "$lib/components/global/TextM.svelte";
	import AgreementModalCompany from "$lib/components/user/AgreementModalCompany.svelte";
	import { error } from "$lib/utils/ui";
	import { ChevronLeft, ChevronRight, X } from "lucide-svelte";
	import { twMerge } from "tailwind-merge";

    let categories = [
        'Basic Company Information',
        'Legal & Regulatory Requirements',
        'Account Credentials',
    ];
    let categIndex = $state(0);
    let categMaxIndex = $derived(categories.length - 1);
    let categCurrent = $derived(categories[categIndex]);
    
    let data = $state({
        name: { value: '', error: '' },
        industry: { value: 'Technology / IT', error: '' },
        address: { value: '', error: '' },
        logo: { value: null, error: '' },
        
        profile: { value: null, error: '' },
        permit: { value: null, error: '' },
        sec: { value: null, error: '' },
        dti: { value: null, error: '' },
        reg_est: { value: null, error: '' },
        cert_dole: { value: null, error: '' },
        cert_npc: { value: null, error: '' },
        reg_pjn: { value: null, error: '' },
        lov: { value: null, error: '' },
        
        email: { value: '', error: '' },
        password: { value: '', error: '' },
        password_confirmed: { value: '', error: '' },
    })
    let industries = [
        'Technology / IT',
        'Finance / Banking / Insurance',
        'Healthcare / Pharmaceuticals',
        'Education / Research',
        'Manufacturing / Industrial',
        'Retail / E-commerce',
        'Food & Beverage / Hospitality',
        'Transportation / Logistics',
        'Energy / Utilities',
        'Media / Entertainment / Advertising',
        'Government / Public Sector',
        'Real Estate / Construction',
        'Consulting / Professional Services',
        'Nonprofit / NGO',
        'Telecommunications',
    ];

    let openAgreementModal = $state(false);
    let openAgreementData = $state(null);

    function validateName(value) {
        let val = value.trim();

        if (val.length === 0)
            data.name.error = 'Name is required.';
        else if (val.length > 255)
            data.name.error = 'Name must not exceed 255 characters';
        else
            data.name.error = '';
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

    function validateLogo(value) {
        data.logo.error = !value ? 'Logo is required.' : '';
    }

    function validateProfile(value) {
        data.profile.error = !value ? 'Company profile is required.' : '';
    }

    function validatePermit(value) {
        data.permit.error = !value ? 'Business permit is required.' : '';
    }

    function validateSec(value) {
        data.sec.error = !value ? 'SEC is required.' : '';
    }

    function validateDti(value) {
        data.dti.error = !value ? 'DTI / CDA reg. is required.' : '';
    }

    function validateRegEst(value) {
        data.reg_est.error = !value ? 'Registry of Establishment is required.' : '';
    }

    function validateCertDole(value) {
        data.cert_dole.error = !value ? 'Certification from DOLE is required.' : '';
    }

    function validateCertNpc(value) {
        data.cert_npc.error = !value ? 'Certification of no pending case is required.' : '';
    }

    function validateRegPjn(value) {
        data.reg_pjn.error = !value ? 'Phil-JobNet reg. is required.' : '';
    }

    function validateLov(value) {
        data.lov.error = !value ? 'List of vacancies is required.' : '';
    }

    function validateEmail(value) {
        let val = value.trim();
        
        if (val.length === 0) {
            data.email.error = 'Email is required';
        } else if (!value.includes('@')) {
            data.email.error = 'Invalid email address';
        } else {
            data.email.error = '';
        }
    }

    function validatePassword(value) {
        let val = value.trim();

        if (val.length === 0)
            data.password.error = 'Password is required.';
        else if (val.length > 8)
            data.password.error = 'Occupation must not exceed 8 characters';
        else
            data.password.error = '';
    }

    function validatePasswordConfirm(value) {
        let val = value.trim();

        if (val.length === 0)
            data.password_confirmed.error = 'Password is required.';
        else if (val.length > 8)
            data.password_confirmed.error = 'Password must not exceed 8 characters';
        else if (val !== data.password.value)
            data.password_confirmed.error = 'Password do not match.';
        else
            data.password_confirmed.error = '';
    }

    function validateAndSubmit() {
        validateName(data.name.value);
        validateAddress(data.address.value);
        validateLogo(data.logo.value);
        validateProfile(data.profile.value);
        validatePermit(data.permit.value);
        validateSec(data.sec.value);
        validateDti(data.dti.value);
        validateRegEst(data.reg_est.value);
        validateCertDole(data.cert_dole.value);
        validateCertNpc(data.cert_npc.value);
        validateRegPjn(data.reg_pjn.value);
        validateLov(data.lov.value);
        validateEmail(data.email.value);
        validatePassword(data.password.value);
        validatePasswordConfirm(data.password_confirmed.value);
        
        if (
            data.name.error ||
            data.address.error ||
            data.logo.error ||
            data.profile.error ||
            data.permit.error ||
            data.sec.error ||
            data.dti.error ||
            data.reg_est.error ||
            data.cert_dole.error ||
            data.cert_npc.error ||
            data.reg_pjn.error ||
            data.lov.error ||
            data.email.error ||
            data.password.error ||
            data.password_confirmed.error
        ) {
            error('Cannot register yet. Please double check all the fields');
            return;
        }

        let formData = new FormData();

        Object.entries(data).forEach(([key, value]) => formData.append(key, value.value));

        openAgreementData = formData;
        openAgreementModal = true;
    }
</script>

<BaseContainer withBgImage={true} class="animate-bg">
    <div class={twMerge(
        "bg-white/50 w-full h-full max-h-full overflow-auto scrollbar p-8",
        !['Legal & Regulatory Requirements'].includes(categCurrent) && 'flex items-center justify-center'
    )}>
        <RoundedCard class={twMerge(
            "p-8 pb-6 md:w-1/3 rounded-xl flex flex-col items-stretch gap-y-5",
            ['Legal & Regulatory Requirements'].includes(categCurrent) && 'mx-auto'
        )}>
            <div class="flex flex-col items-stretch gap-y-4">
                <TextM>{categCurrent}</TextM>
                <div>
                    {#if categCurrent === 'Basic Company Information'}
                        <InputText
                            label='Name'
                            maxLength={255}
                            bind:value={data.name.value}
                            bind:error={data.name.error}
                            onInput={validateName}
                        />
                        <Dropdown
                            label='Industry'
                            bind:value={data.industry.value}
                            bind:error={data.industry.error}
                        >
                            {#each industries as industry}
                                <DropdownItem value={industry} label={industry}/>
                            {/each}
                        </Dropdown>
                        <InputText
                            label='Address'
                            maxLength={512}
                            bind:value={data.address.value}
                            bind:error={data.address.error}
                            onInput={validateAddress}
                        />
                        <InputFile
                            label='Logo'
                            placeholder='company-logo.png'
                            accept={['.png', '.jpeg', '.jpg']}
                            bind:value={data.logo.value}
                            bind:error={data.logo.error}
                            onChange={validateLogo}
                        />
                    {:else if categCurrent === 'Legal & Regulatory Requirements'}
                        <InputFile
                            label='Full Company Profile'
                            placeholder='company-profile.pdf'
                            accept={['.pdf']}
                            bind:value={data.profile.value}
                            bind:error={data.profile.error}
                            onChange={validateProfile}
                        />
                        <InputFile
                            label='Business Permit'
                            placeholder='business-permit.pdf'
                            accept={['.pdf']}
                            bind:value={data.permit.value}
                            bind:error={data.permit.error}
                            onChange={validatePermit}
                        />
                        <InputFile
                            label='SEC'
                            placeholder='sec.pdf'
                            accept={['.pdf']}
                            bind:value={data.sec.value}
                            bind:error={data.sec.error}
                            onChange={validateSec}
                        />
                        <InputFile
                            label='DTI / CDA Reg.'
                            placeholder='dti-cda-reg.pdf'
                            accept={['.pdf']}
                            bind:value={data.dti.value}
                            bind:error={data.dti.error}
                            onChange={validateDti}
                        />
                        <InputFile
                            label='Registry of Establishment fr. DOLE'
                            placeholder='dole-reg-of-est.pdf'
                            accept={['.pdf']}
                            bind:value={data.reg_est.value}
                            bind:error={data.reg_est.error}
                            onChange={validateRegEst}
                        />
                        <InputFile
                            label='Certification from DOLE Provincial Office'
                            placeholder='dole-cert.pdf'
                            accept={['.pdf']}
                            bind:value={data.cert_dole.value}
                            bind:error={data.cert_dole.error}
                            onChange={validateCertDole}
                        />
                        <InputFile
                            label='Certification of No Pending Case'
                            placeholder='no-pending-case-cert.pdf'
                            accept={['.pdf']}
                            bind:value={data.cert_npc.value}
                            bind:error={data.cert_npc.error}
                            onChange={validateCertNpc}
                        />
                        <InputFile
                            label='Phil-Jobnet Reg.'
                            placeholder='reg-philjobnet.pdf'
                            accept={['.pdf']}
                            bind:value={data.reg_pjn.value}
                            bind:error={data.reg_pjn.error}
                            onChange={validateRegPjn}
                        />
                        <InputFile
                            label='List of Vacancies (w/Qualifications & No. of Vacancies per position)'
                            placeholder='list-of-vacancies.pdf'
                            accept={['.pdf']}
                            bind:value={data.lov.value}
                            bind:error={data.lov.error}
                            onChange={validateLov}
                        />
                    {:else}
                        <InputText
                            label='Email'
                            bind:value={data.email.value}
                            bind:error={data.email.error}
                            onInput={validateEmail}
                        />
                        <InputPass
                            label='Password'
                            showIcon={false}
                            bind:value={data.password.value}
                            bind:error={data.password.error}
                            onInput={validatePassword}
                        />
                        <InputPass
                            label='Re-enter Password'
                            showIcon={false}
                            bind:value={data.password_confirmed.value}
                            bind:error={data.password_confirmed.error}
                            onInput={validatePasswordConfirm}
                        />
                    {/if}
                </div>
            </div>
            <div class="grid grid-cols-2 gap-x-4">
                {#if categIndex === 0}
                    <ButtonM
                        Icon={X}
                        label='Cancel'
                        onclick={() => goto('/registration', { replaceState: true })}
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
                        onclick={validateAndSubmit}
                    />
                {/if}
            </div>
        </RoundedCard>
    </div>
</BaseContainer>

<AgreementModalCompany
    bind:show={openAgreementModal}
    data={openAgreementData}
/>