<script>
	import ButtonM from "$lib/components/global/ButtonM.svelte";
	import Dropdown from "$lib/components/global/Dropdown.svelte";
	import DropdownItem from "$lib/components/global/DropdownItem.svelte";
	import InputText from "$lib/components/global/InputText.svelte";
	import ConfirmModal from "$lib/components/global/modals/ConfirmModal.svelte";
	import Modal from "$lib/components/global/modals/Modal.svelte";
	import Pagination from "$lib/components/global/Pagination.svelte";
	import AdminHeader from "$lib/components/user/AdminHeader.svelte";
	import { get, patchJson, postJson } from "$lib/utils/api";
	import { error, formatDate, success } from "$lib/utils/ui";
	import { Plus, Search, UserPlus } from "lucide-svelte";
	import { onMount } from "svelte";
	import { twMerge } from "tailwind-merge";

    let query = $state('');
    let activeFilter = $state(null);

    let data = $state({
        results: null,
        total: 0,
        page: 1,
        per_page: 20,
        total_pages: 0,
        has_next: false,
        has_prev: false,
    })
    let dataLoading = $state(false)

    let confirmDeact = $state({ item: null, show: false })
    let confirmReact = $state({ item: null, show: false })

    let openAddModal = $state(false);

    let pstaffData = $state({
        email: { value: '', error: '' },
        first_name: { value: '', error: '' },
        middle_name: { value: '', error: '' },
        last_name: { value: '', error: '' },
    });

    async function onSearch() {
        await get('/api/user/peso-staff', {
            query: {
                enabled: activeFilter ?? '',
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
                console.log(newData);
            },
            onFail: async (newData) => error(newData?.message ?? 'Unable to fetch PESO Staffs.'),
        });
    }

    async function onDeact(id) {
        await patchJson('/api/user/peso-staff/disable/' + id, null, {
            onSuccess: async (newData) => {
                confirmDeact.show = false;
                const index = data.results.findIndex((r) => r.id === newData.id);
                await onSearch();
            },
            onFail: async (newData) => error(newData?.message ?? 'Unable to deactivate PESO Staff.'),
        });
    }

    async function onReact(id) {
        await patchJson('/api/user/peso-staff/enable/' + id, null, {
            onSuccess: async (newData) => {
                confirmReact.show = false;
                const index = data.results.findIndex((r) => r.id === newData.id);
                await onSearch();
            },
            onFail: async (newData) => error(newData?.message ?? 'Unable to activate PESO Staff.'),
        });
    }

    async function onAdd() {
        if (
            !pstaffData.email.value.trim() ||
            !pstaffData.first_name.value.trim() ||
            !pstaffData.last_name.value.trim() ||
            pstaffData.email.error ||
            pstaffData.first_name.error ||
            pstaffData.last_name.error
        ) {
            error('Cannot add PESO Staff yet.');
            return;
        }

        await postJson('/api/user/peso-staff', {
            email: pstaffData.email.value,
            first_name: pstaffData.first_name.value,
            middle_name: pstaffData.middle_name.value,
            last_name: pstaffData.last_name.value,
        }, {
            onSuccess: async () => {
                openAddModal = false;
                success(pstaffData.first_name.value + ' ' + pstaffData.last_name.value + ' has been added.');
                pstaffData = {
                    email: { value: '', error: '' },
                    first_name: { value: '', error: '' },
                    middle_name: { value: '', error: '' },
                    last_name: { value: '', error: '' },
                };
                await onSearch();
            },
            onFail: async (err) => await error(err?.message ?? 'Unable to add PESO Staff due to an error.')
        });
    }

    onMount(onSearch)
</script>

<AdminHeader heading='Manage PESO Staffs'/>

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
            <InputText
                label='Search'
                placeholder='Search PESO Staffs'
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
            Icon={UserPlus}
            label='Add'
            onclick={() => openAddModal = true}
            class='mb-3'
        />
    </div>

    <div class="grow min-h-0 relative">
        <div class="w-full overflow-auto rounded border border-gray-200 max-h-full max-w-[calc(75vw-32px)] scrollbar">
            <table class="w-full text-sm text-left">
                <thead>
                    <tr class="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide sticky top-0 z-10 *:text-nowrap">
                        <th class="px-4 py-3 font-medium">First Name</th>
                        <th class="px-4 py-3 font-medium">Middle Name</th>
                        <th class="px-4 py-3 font-medium">Last Name</th>
                        <th class="px-4 py-3 font-medium">Email</th>
                        <th class="px-4 py-3 font-medium">Status</th>
                        <th class="px-4 py-3 font-medium">Created</th>
                        <th class="px-4 py-3 font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each data.results as pstaff (pstaff.id)}
                        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors **:text-nowrap">
                            <td class="px-4 py-3 text-gray-800">{pstaff.profile.first_name}</td>
                            <td class="px-4 py-3 text-gray-800">{pstaff.profile.middle_name ? pstaff.profile.middle_name : '-'}</td>
                            <td class="px-4 py-3 text-gray-800">{pstaff.profile.last_name}</td>
                            <td class="px-4 py-3 text-gray-800">
                                {pstaff.email}
                                {#if !pstaff.email_verified}
                                    (not yet verified)
                                {/if}
                            </td>
                            <td class="px-4 py-3">
                                {#if pstaff.enabled}
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">
                                        Active
                                    </span>
                                {:else}
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-500">
                                        Inactive
                                    </span>
                                {/if}
                            </td>
                            <td class="px-4 py-3 text-gray-500">{formatDate(pstaff.profile.created_at)}</td>
                            <td class="px-4 py-3">
                                {#if pstaff.email_verified}
                                    <button
                                        onclick={() => {
                                            if (pstaff.enabled) {
                                                confirmDeact.item = pstaff;
                                                confirmDeact.show = true;
                                            } else {
                                                confirmReact.item = pstaff;
                                                confirmReact.show = true;
                                            }
                                        }}
                                        class={twMerge(
                                            "text-xs px-3 py-1 rounded border transition-colors cursor-pointer",
                                            pstaff.enabled
                                                ? 'border-red-100 text-red-500 hover:bg-red-50'
                                                : 'border-blue-100 text-blue-500 hover:bg-blue-50'
                                        )}
                                    >
                                        {pstaff.enabled ? 'Deactivate' : 'Activate'}
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

<ConfirmModal
    bind:show={confirmDeact.show}
    text={`Deactivate ${confirmDeact.item?.profile?.first_name} ${confirmDeact.item?.profile?.last_name}?`}
    onConfirm={async () => onDeact(confirmDeact.item.id)}
/>

<ConfirmModal
    bind:show={confirmReact.show}
    text={`Activate ${confirmReact.item?.profile?.first_name} ${confirmReact.item?.profile?.last_name}?`}
    onConfirm={async () => onReact(confirmReact.item.id)}
/>

<Modal
    bind:show={openAddModal}
    heading='Add PESO Staff'
    class='gap-y-0'
>
    <InputText
        label='Email'
        placeholder='Enter email'
        bind:value={pstaffData.email.value}
        bind:error={pstaffData.email.error}
        onInput={(value) => {
            if (value.trim().length === 0) {
                pstaffData.email.error = 'Email is required';
            } else if (!value.includes('@')) {
                pstaffData.email.error = 'Invalid email address';
            } else {
                pstaffData.email.error = '';
            }
        }}
    />
    <InputText
        label='First Name'
        placeholder='Enter first name'
        bind:value={pstaffData.first_name.value}
        bind:error={pstaffData.first_name.error}
        onInput={(value) => {
            if (value.trim().length === 0) {
                pstaffData.first_name.error = 'First name is required';
            } else if (value.trim().length > 50) {
                pstaffData.first_name.error = 'First name should not exceed 50 characters.';
            } else {
                pstaffData.first_name.error = '';
            }
        }}
    />
    <InputText
        label='Middle Name'
        placeholder='Enter middle name'
        bind:value={pstaffData.middle_name.value}
        bind:error={pstaffData.middle_name.error}
        onInput={(value) => {
            if (value.trim().length > 50) {
                pstaffData.middle_name.error = 'Middle name should not exceed 50 characters.';
            } else {
                pstaffData.middle_name.error = '';
            }
        }}
    />
    <InputText
        label='Last Name'
        placeholder='Enter last name'
        bind:value={pstaffData.last_name.value}
        bind:error={pstaffData.last_name.error}
        onInput={(value) => {
            if (value.trim().length === 0) {
                pstaffData.last_name.error = 'Last name is required';
            } else if (value.trim().length > 50) {
                pstaffData.last_name.error = 'Last name should not exceed 50 characters.';
            } else {
                pstaffData.last_name.error = '';
            }
        }}
    />
    <ButtonM
        Icon={Plus}
        label='Add'
        onclick={onAdd}
        class='mt-2'
    />
</Modal>