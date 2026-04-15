<script>
	import ButtonM from "$lib/components/global/ButtonM.svelte";
	import Dropdown from "$lib/components/global/Dropdown.svelte";
	import DropdownItem from "$lib/components/global/DropdownItem.svelte";
	import InputText from "$lib/components/global/InputText.svelte";
	import InputTextArea from "$lib/components/global/InputTextArea.svelte";
	import ConfirmModal from "$lib/components/global/modals/ConfirmModal.svelte";
	import Modal from "$lib/components/global/modals/Modal.svelte";
	import Pagination from "$lib/components/global/Pagination.svelte";
	import TextL from "$lib/components/global/TextL.svelte";
	import TextM from "$lib/components/global/TextM.svelte";
	import TextS from "$lib/components/global/TextS.svelte";
	import TextX from "$lib/components/global/TextX.svelte";
	import AdminHeader from "$lib/components/user/AdminHeader.svelte";
	import RequirementP from "$lib/components/user/RequirementP.svelte";
	import { user } from "$lib/stores/user";
	import { apiUrl, get, patchJson, postJson, queryToString } from "$lib/utils/api";
	import { error, formatDate, success } from "$lib/utils/ui";
	import { AlertCircle, BadgeCheck, Building, Calendar, Check, Factory, File, Globe, Mail, MapPin, MessageCircle, Plus, Search, ShieldUser, X } from "lucide-svelte";
	import { onMount } from "svelte";
	import { twMerge } from "tailwind-merge";

    let query = $state('');
    let activeFilter = $state(null);
    let statusFilter = $state(null);
    let industryFilter = $state(null);

    let data = $state({
        results: null,
        total: 0,
        page: 1,
        per_page: 20,
        total_pages: 0,
        has_next: false,
        has_prev: false,
    });
    let dataLoading = $state(false);

    let confirmDeact = $state({ item: null, show: false });
    let confirmReact = $state({ item: null, show: false });
    let confirmVerify = $state({ item: null, show: false });
    let confirmReject = $state({ item: null, show: false });
    let confirmPend = $state({ item: null, show: false });
    let rejectionMessage = $state({ value: '', error: '' });

    let openAddModal = $state(false);
    let openProfile = $state(false);
    let openedProfile = $state(null);
    let openAppeals = $state(false);
    let openAppealsProfile = $state(null);

    async function onSearch() {
        await get('/api/user/company', {
            query: {
                enabled: activeFilter ?? '',
                stat_sysad: statusFilter ?? '',
                industry: industryFilter ?? '',
                query,
                page: data.page,
                per_page: data.per_page,
            },
            onStart: () => dataLoading = true,
            onFinish: () => dataLoading = false,
            onSuccess: async (newData) => {
                data.results = newData.results;
                data.total = newData.total;
                data.page = newData.page;
                data.per_page = newData.per_page;
                data.total_pages = newData.total_pages;
                data.has_next = newData.has_next;
                data.has_prev = newData.has_prev;
            },
            onFail: async (newData) => error(newData?.message ?? 'Unable to fetch Companies.'),
        });
    }

    async function onLoadProfile(id, forAppeal = false) {
        await get('/api/user/company/' + id,
            {
                onSuccess: async (_data) => {
                    if (forAppeal) {
                        openAppealsProfile = _data;
                        openAppeals = true;
                    } else {
                        openedProfile = _data;
                        openProfile = true;
                    }
                },
                onFail: async (err) => error(err?.message ?? 'Unable to fetch company profile.')
            }
        );
    }

    async function onDeact(id) {
        await patchJson('/api/user/company/disable/' + id, null, {
            onSuccess: async (newData) => {
                success('Company has been deactivated.');
                confirmDeact.show = false;
                const index = data.results.findIndex((r) => r.id === newData.id);
                await onSearch();
            },
            onFail: async (newData) => error(newData?.message ?? 'Unable to deactivate Company.'),
        });
    }

    async function onReact(id) {
        await patchJson('/api/user/company/enable/' + id, null, {
            onSuccess: async (newData) => {
                success('Company has been activated.');
                confirmReact.show = false;
                const index = data.results.findIndex((r) => r.id === newData.id);
                await onSearch();
            },
            onFail: async (newData) => error(newData?.message ?? 'Unable to activate Company.'),
        });
    }

    async function onVerify() {
        await patchJson('/api/user/company/verify/' + confirmVerify.item?.id, null, {
            onStart: () => dataLoading = true,
            onFinish: () => dataLoading = false,
            onSuccess: async (newData) => {
                success(confirmVerify.item.profile.name + ' has been verified.');
                confirmVerify.show = false;
                await onSearch();
            },
            onFail: async (err) => error(err?.message ?? 'Unable to verify company due to an error.'),
        });
    }

    async function onReject() {
        if (rejectionMessage.error || !rejectionMessage.value.trim()) {
            error('Cannot reject company yet.');
            return;
        }
        
        await patchJson('/api/user/company/reject/' + confirmReject.item?.id, 
            { message: rejectionMessage.value },
            {
                onStart: () => dataLoading = true,
                onFinish: () => dataLoading = false,
                onSuccess: async (newData) => {
                    success(confirmReject.item.profile.name + ' has been rejected.');
                    confirmReject.show = false;
                    openAppeals = false;
                    await onSearch();
                },
                onFail: async (err) => error(err?.message ?? 'Unable to reject company due to an error.'),
            }
        );
    }

    async function onPend() {
        await patchJson('/api/user/company/pend/' + confirmPend.item?.id, 
            { message: rejectionMessage.value },
            {
                onStart: () => dataLoading = true,
                onFinish: () => dataLoading = false,
                onSuccess: async (newData) => {
                    success(confirmPend.item.profile.name + ' has been marked as pending for rejection.');
                    confirmPend.show = false;
                    openAppeals = false;
                    openAppealsProfile = null;
                    await onSearch();
                },
                onFail: async (err) => error(err?.message ?? 'Unable to mark company as pending due to an error.'),
            }
        );
    }

    onMount(onSearch);
</script>

<AdminHeader heading='Manage Companies'/>

{#if openProfile}
    <div class="flex-1 min-h-0 space-y-4 bg-white flex flex-col items-stretch">
        <div class="w-full overflow-auto max-h-full scrollbar">
            <div class="flex flex-col overflow-clip">
                <div class="flex items-center justify-between p-4">
                    <div class="grow flex items-center gap-x-3">
                        <div 
                            style={`background-image: url(${apiUrl('/Uploads/company/logo/' + openedProfile.profile.logo)})`}
                            class="w-10 h-10 bg-cover bg-center rounded-full border border-gray-200"
                        ></div>
                        <h1 class='text-xl max-w-7/10 truncate flex items gap-x-3'>{openedProfile.profile.name}</h1>
                    </div>
                    <button
                        Icon={X}
                        label='Close'
                        onclick={() => {
                            openProfile = false;
                            openedProfile = null
                        }}
                        class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-red-100 text-red-500 hover:bg-red-50"
                    >
                        Close
                    </button>
                </div>
        
                <div class="flex flex-col gap-y-2 p-4 border-t border-gray-100">
                    <TextS class='text-gray-700/75'>Basic Information</TextS>
                    <div class="flex flex-col gap-y-2">
                        <div class="flex items-center gap-x-2">
                            <Mail class='w-4 text-gray-400'/>
                            <TextS class='text-gray-600'>{openedProfile.email}</TextS>
                        </div>
                        <div class="flex items-center gap-x-2">
                            <MapPin class='w-4 text-gray-400'/>
                            <TextS class='text-gray-600'>{openedProfile.profile.address}</TextS>
                        </div>
                        <div class="flex items-center gap-x-2">
                            <Factory class='w-4 text-gray-400'/>
                            <TextS class='text-gray-600'>{openedProfile.profile.industry}</TextS>
                        </div>
                        <div class="flex items-center gap-x-2">
                            {#if openedProfile.profile.ver_stat_pstaff === 'Pending'}
                                <AlertCircle class='w-4 text-yellow-500'/>
                                <TextS class='text-yellow-500'>Needs your verification!</TextS>
                            {/if}
                        </div>
                    </div>
                </div>
        
                <div class="flex flex-col gap-y-2 p-4 border-t border-gray-100">
                    <TextS class='text-gray-700/75'>Submitted Requirements</TextS>
                    <RequirementP bind:profile={openedProfile} reqKey='req_company_profile' reqDisplay='Company Profile'/>
                    <RequirementP bind:profile={openedProfile} reqKey='req_business_permit' reqDisplay='Business Permit'/>
                    <RequirementP bind:profile={openedProfile} reqKey='req_sec' reqDisplay='SEC'/>
                    <RequirementP bind:profile={openedProfile} reqKey='req_dti_cda' reqDisplay='DTI / CDA Reg.'/>
                    <RequirementP bind:profile={openedProfile} reqKey='req_reg_of_est' reqDisplay='Registry of Establishment fr. DOLE'/>
                    <RequirementP bind:profile={openedProfile} reqKey='req_cert_from_dole' reqDisplay='Certification from DOLE Provincial Office'/>
                    <RequirementP bind:profile={openedProfile} reqKey='req_cert_no_case' reqDisplay='Certification of No Pending Case'/>
                    <RequirementP bind:profile={openedProfile} reqKey='req_philjobnet_reg' reqDisplay='Phil-JobNet Reg.'/>
                    <RequirementP bind:profile={openedProfile} reqKey='req_list_of_vacancies' reqDisplay='List of Vacancies'/>
                </div>
            </div>
        </div>
    </div>
{:else if openAppeals}
    <div class="flex-1 min-h-0 space-y-4 bg-white flex flex-col items-stretch">
        <div class="w-full overflow-auto max-h-full scrollbar">
            <div class="flex flex-col overflow-clip">
                <div class="flex items-center justify-between p-4">
                    <div class="grow flex items-center gap-x-3">
                        <div 
                            style={`background-image: url(${apiUrl('/Uploads/company/logo/' + openAppealsProfile.profile.logo)})`}
                            class="w-10 h-10 bg-cover bg-center rounded-full border border-gray-200"
                        ></div>
                        <h1 class='text-xl max-w-7/10 truncate flex items gap-x-3'>{openAppealsProfile.profile.name}'s Appeal</h1>
                    </div>
                    <button
                        Icon={X}
                        label='Close'
                        onclick={() => {
                            openAppeals = false;
                            openAppealsProfile = null
                        }}
                        class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-red-100 text-red-500 hover:bg-red-50"
                    >
                        Close
                    </button>
                </div>
            </div>

            <div class="flex flex-col gap-y-2 p-4 border-t border-gray-100">
                <TextS class='text-gray-700/75'>Rejection Information</TextS>
                <div class="flex flex-col gap-y-2">
                    <div class="flex items-center gap-x-2">
                        <Calendar class='w-4 text-gray-400'/>
                        <TextS>Rejected on: <span class="text-gray-600 font-bold">{formatDate(openAppealsProfile.profile.rejection_pstaff.created_at)}</span></TextS>
                    </div>
                    <div class="flex flex-col items-stretch">
                        <div class="flex items-center gap-x-2">
                            <AlertCircle class='w-4 text-red-900/65'/>
                            <TextS class='text-red-900'>Rejection reason:</TextS>
                        </div>
                        <div class="text-sm rounded text-gray-600 ml-6 pt-1">
                            {openAppealsProfile.profile.rejection_pstaff.message}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col gap-y-2 p-4 border-t border-gray-100">
                <div class="flex items-center justify-between">
                    <TextS class='text-gray-700/75'>Appeal Information</TextS>
                    {#if openAppealsProfile.profile.rejection_pstaff.appeal}
                        <button
                            Icon={X}
                            label='Close'
                            onclick={() => {
                                confirmPend.show = true;
                                confirmPend.item = openAppealsProfile;
                            }}
                            class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-blue-100 text-blue-500 hover:bg-blue-50"
                        >
                            Mark Company as Pending for Verification
                        </button>
                    {/if}
                </div>
                <div class="flex flex-col gap-y-2">
                    {#if openAppealsProfile.profile.rejection_pstaff.appeal}
                        <div class="flex items-center gap-x-2">
                            <Calendar class='w-4 text-gray-400'/>
                            <TextS>Appealed on: <span class="text-gray-600 font-bold">{formatDate(openAppealsProfile.profile.rejection_pstaff.appeal.created_at)}</span></TextS>
                        </div>
                        <div class="flex flex-col items-stretch">
                            <div class="flex items-center gap-x-2">
                                <MessageCircle class='w-4 text-gray-400'/>
                                <TextS class='text-gray-600'>Appeal:</TextS>
                            </div>
                            <div class="text-sm rounded text-gray-600 ml-6 pt-1">
                                {openAppealsProfile.profile.rejection_pstaff.appeal.message}
                            </div>
                        </div>
                    {:else}
                        <TextS>{openAppealsProfile.profile.name} has not appealed yet.</TextS>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{:else}
    <div class="flex-1 min-h-0 space-y-2 overflow-y-hidden px-4 pt-0 bg-white flex flex-col items-stretch">
        <div class="flex items-end gap-x-4">
            <div class="flex items-end gap-x-4 grow">
                <Dropdown
                    label='Status'
                    bind:value={activeFilter}
                    onChange={async () => {
                        data.page = 1;
                        await onSearch();
                    }}
                >
                    <DropdownItem label='All' value={null}/>
                    <DropdownItem label='Active' value={true}/>
                    <DropdownItem label='Inactive' value={false}/>
                </Dropdown>
                <Dropdown
                    label='Ver. Status'
                    bind:value={statusFilter}
                    onChange={async () => {
                        data.page = 1;
                        await onSearch();
                    }}
                >
                    <DropdownItem label='All' value={null}/>
                    <DropdownItem label='Pending' value='Pending'/>
                    <DropdownItem label='Verified' value='Verified'/>
                    <DropdownItem label='Rejected' value='Rejected'/>
                </Dropdown>
                <Dropdown
                    label='Industry'
                    bind:value={industryFilter}
                    onChange={async () => {
                        data.page = 1;
                        await onSearch();
                    }}
                >
                    <DropdownItem label='All' value={null}/>
                    <DropdownItem label='Technology / IT' value='Technology / IT'/>
                    <DropdownItem label='Finance / Banking / Insurance' value='Finance / Banking / Insurance'/>
                    <DropdownItem label='Healthcare / Pharmaceuticals' value='Healthcare / Pharmaceuticals'/>
                    <DropdownItem label='Education / Research' value='Education / Research'/>
                    <DropdownItem label='Manufacturing / Industrial' value='Manufacturing / Industrial'/>
                    <DropdownItem label='Retail / E-commerce' value='Retail / E-commerce'/>
                    <DropdownItem label='Food & Beverage / Hospitality' value='Food & Beverage / Hospitality'/>
                    <DropdownItem label='Transportation / Logistics' value='Transportation / Logistics'/>
                    <DropdownItem label='Energy / Utilities' value='Energy / Utilities'/>
                    <DropdownItem label='Media / Entertainment / Advertising' value='Media / Entertainment / Advertising'/>
                    <DropdownItem label='Government / Public Sector' value='Government / Public Sector'/>
                    <DropdownItem label='Real Estate / Construction' value='Real Estate / Construction'/>
                    <DropdownItem label='Consulting / Professional Services' value='Consulting / Professional Services'/>
                    <DropdownItem label='Nonprofit / NGO' value='Nonprofit / NGO'/>
                    <DropdownItem label='Telecommunications' value='Telecommunications'/>
                </Dropdown>
                <InputText
                    label='Search'
                    placeholder='Search Companies'
                    bind:value={query}
                    class='grow'
                    allowClear={true}
                    onClear={onSearch}
                    BtnIcon={Search}
                    btnLabel='Search'
                    onBtnClick={onSearch}
                />
            </div>
        </div>

        <div class="grow min-h-0 relative">
            <div class="w-full overflow-auto rounded border border-gray-200 max-h-full max-w-[calc(75vw-32px)] scrollbar">
                <table class="w-full text-sm text-left">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide sticky top-0 z-10 *:text-nowrap">
                            <th class="px-4 py-3 font-medium">Name</th>
                            <th class="px-4 py-3 font-medium">Industry</th>
                            <th class="px-4 py-3 font-medium">Address</th>
                            <th class="px-4 py-3 font-medium">Email</th>
                            <th class="px-4 py-3 font-medium">Status</th>
                            <th class="px-4 py-3 font-medium">Verification Status</th>
                            <th class="px-4 py-3 font-medium">Registered</th>
                            <th class="px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.results as company (company.id)}
                            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors **:text-nowrap">
                                <td class="px-4 py-3 text-gray-800 flex items-center gap-x-2" title={company.profile.name}>
                                    <div 
                                        style={`background-image: url(${apiUrl('/Uploads/company/logo/' + company.profile.logo)})`}
                                        class="w-7 h-7 bg-cover bg-center rounded-full border border-gray-200"
                                    ></div>
                                    <span class="">{company.profile.name}</span>
                                </td>
                                <td class="px-4 py-3 text-gray-800" title={company.profile.industry}>{company.profile.industry}</td>
                                <td class="px-4 py-3 text-gray-800" title={company.profile.address}>{company.profile.address}</td>
                                <td class="px-4 py-3 text-gray-800">{company.email}</td>
                                <td class="px-4 py-3">
                                    {#if company.enabled}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">
                                            Active
                                        </span>
                                    {:else}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-500">
                                            Inactive
                                        </span>
                                    {/if}
                                </td>
                                <td class="px-4 py-3">
                                    {#if company.profile.ver_stat_pstaff === 'Verified'}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">
                                            Verified
                                        </span>
                                    {:else if company.profile.ver_stat_pstaff === 'Pending'}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-600">
                                            Pending
                                        </span>
                                    {:else}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-500">
                                            Rejected
                                        </span>
                                    {/if}
                                </td>
                                <td class="px-4 py-3 text-gray-500">{formatDate(company.profile.created_at)}</td>
                                <td class="px-4 py-3 flex items-center gap-x-2">
                                    <button
                                        onclick={async () => await onLoadProfile(company.id)}
                                        class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-blue-100 text-blue-500 hover:bg-blue-50"
                                    >
                                        View Profile
                                    </button>
                                    <button
                                        onclick={() => {
                                            if (company.enabled) {
                                                confirmDeact.item = company;
                                                confirmDeact.show = true;
                                            } else {
                                                confirmReact.item = company;
                                                confirmReact.show = true;
                                            }
                                        }}
                                        class={twMerge(
                                            "text-xs px-3 py-1 rounded border transition-colors cursor-pointer",
                                            company.enabled
                                                ? 'border-red-100 text-red-500 hover:bg-red-50'
                                                : 'border-blue-100 text-blue-500 hover:bg-blue-50'
                                        )}
                                    >
                                        {company.enabled ? 'Deactivate' : 'Activate'}
                                    </button>
                                    {#if company.profile.ver_stat_pstaff === 'Pending'}
                                        <button
                                            onclick={() => {
                                                confirmVerify.item = company;
                                                confirmVerify.show = true;
                                            }}
                                            class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-green-100 text-green-500 hover:bg-green-50"
                                        >
                                            Verify
                                        </button>
                                        <button
                                            onclick={() => {
                                                confirmReject.item = company;
                                                confirmReject.show = true;
                                            }}
                                            class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-red-100 text-red-500 hover:bg-red-50"
                                        >
                                            Reject
                                        </button>
                                    {:else if company.profile.ver_stat_pstaff === 'Rejected'}
                                        <button
                                            onclick={async () => await onLoadProfile(company.id, true)}
                                            class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-blue-100 text-blue-500 hover:bg-blue-50"
                                        >
                                            View Appeal
                                        </button>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>

        <Pagination {data} {onSearch} class='sticky bottom-0'/>
    </div>
{/if}

<ConfirmModal
    bind:show={confirmDeact.show}
    text={`Deactivate ${confirmDeact.item?.profile?.name}`}
    onConfirm={async () => onDeact(confirmDeact.item.id)}
/>

<ConfirmModal
    bind:show={confirmReact.show}
    text={`Activate ${confirmReact.item?.profile?.name}`}
    onConfirm={async () => onReact(confirmReact.item.id)}
/>

<ConfirmModal
    bind:show={confirmVerify.show}
    text={`Verify ${confirmVerify.item?.profile?.name}`}
    onConfirm={onVerify}
/>

<ConfirmModal
    bind:show={confirmPend.show}
    text={`Mark ${confirmPend.item?.profile?.name} as pending?`}
    onConfirm={onPend}
/>

<Modal
    show={confirmReject.show}
    heading='Company Rejection'
    class='gap-y-0'
>
    <TextS class='mt-4'>Please state your reason for rejecting the company.</TextS>

    <InputTextArea
        label='Rejection Reason'
        bind:value={rejectionMessage.value}
        bind:error={rejectionMessage.error}
        minLength={1}
        maxLength={1000}
        onInput={(value) => rejectionMessage.error = !value.trim() ? 'Rejection reason is required' : ''}
    />

    <ButtonM
        Icon={X}
        label='Reject'
        onclick={onReject}
        class='mt-2'
    />
</Modal>