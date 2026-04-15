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

    let deanData = $state({
        email: { value: '', error: '' },
        first_name: { value: '', error: '' },
        middle_name: { value: '', error: '' },
        last_name: { value: '', error: '' },
        school_id: { value: 0, error: '' },
    });

    let schools = $state([]);

    async function onSearch() {
        await get('/api/user/dean', {
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
            onFail: async (newData) => error(newData?.message ?? 'Unable to fetch Deans.'),
        });
    }

    async function onDeact(id) {
        await patchJson('/api/user/dean/disable/' + id, null, {
            onSuccess: async (newData) => {
                confirmDeact.show = false;
                const index = data.results.findIndex((r) => r.id === newData.id);
                await onSearch();
            },
            onFail: async (newData) => error(newData?.message ?? 'Unable to deactivate Dean.'),
        });
    }

    async function onReact(id) {
        await patchJson('/api/user/dean/enable/' + id, null, {
            onSuccess: async (newData) => {
                confirmReact.show = false;
                const index = data.results.findIndex((r) => r.id === newData.id);
                await onSearch();
            },
            onFail: async (newData) => error(newData?.message ?? 'Unable to activate Dean.'),
        });
    }

    async function onAdd() {
        if (
            !deanData.email.value.trim() ||
            !deanData.first_name.value.trim() ||
            !deanData.last_name.value.trim() ||
            deanData.school_id === 0 ||
            deanData.email.error ||
            deanData.first_name.error ||
            deanData.last_name.error ||
            deanData.school_id.error
        ) {
            error('Cannot add Dean yet.');
            return;
        }

        await postJson('/api/user/dean', {
            email: deanData.email.value,
            first_name: deanData.first_name.value,
            middle_name: deanData.middle_name.value,
            last_name: deanData.last_name.value,
            school_id: deanData.school_id.value,
        }, {
            onSuccess: async () => {
                openAddModal = false;
                success(deanData.first_name.value + ' ' + deanData.last_name.value + ' has been added.');
                deanData = {
                    email: { value: '', error: '' },
                    first_name: { value: '', error: '' },
                    middle_name: { value: '', error: '' },
                    last_name: { value: '', error: '' },
                };
                await onSearch();
            },
            onFail: async (err) => await error(err?.message ?? 'Unable to add Dean due to an error.')
        });
    }

    onMount(async () => {
        await get('/api/institution/school/all', {
            onSuccess: async (data) => {
                schools = data;

                if (data.length > 0) deanData.school_id.value = data[0].id;
            },
            onFail: async (data) => error(data?.message ?? 'Unable to fetch schools.')
        });
        await onSearch();
    });
</script>

<AdminHeader heading='Manage Deans'/>

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
                placeholder='Search Deans'
                bind:value={query}
                class='grow'
                allowClear={true}
                onClear={onSearch}
                BtnIcon={Search}
                btnLabel='Search'
                onBtnClick={onSearch}
            />
        </div>
        {#if schools}
            <ButtonM
                Icon={UserPlus}
                label='Add'
                onclick={() => openAddModal = true}
                class='mb-3'
            />
        {/if}
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
                        <th class="px-4 py-3 font-medium">School</th>
                        <th class="px-4 py-3 font-medium">Status</th>
                        <th class="px-4 py-3 font-medium">Created</th>
                        <th class="px-4 py-3 font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each data.results as deans (deans.id)}
                        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors **:text-nowrap">
                            <td class="px-4 py-3 text-gray-800">{deans.profile.first_name}</td>
                            <td class="px-4 py-3 text-gray-800">{deans.profile.middle_name ? deans.profile.middle_name : '-'}</td>
                            <td class="px-4 py-3 text-gray-800">{deans.profile.last_name}</td>
                            <td class="px-4 py-3 text-gray-800">
                                {deans.email}
                                {#if !deans.email_verified}
                                    (not yet verified)
                                {/if}
                            </td>
                            <td class="px-4 py-3 text-gray-800 text-nowrap" title={deans.profile.school.name}>{deans.profile.school.name}</td>
                            <td class="px-4 py-3">
                                {#if deans.enabled}
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">
                                        Active
                                    </span>
                                {:else}
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-500">
                                        Inactive
                                    </span>
                                {/if}
                            </td>
                            <td class="px-4 py-3 text-gray-500">{formatDate(deans.profile.created_at)}</td>
                            <td class="px-4 py-3">
                                {#if !deans.default}
                                    {#if deans.email_verified}
                                        <button
                                            onclick={() => {
                                                if (deans.enabled) {
                                                    confirmDeact.item = deans;
                                                    confirmDeact.show = true;
                                                } else {
                                                    confirmReact.item = deans;
                                                    confirmReact.show = true;
                                                }
                                            }}
                                            class={twMerge(
                                                "text-xs px-3 py-1 rounded border transition-colors cursor-pointer",
                                                deans.enabled
                                                    ? 'border-red-100 text-red-500 hover:bg-red-50'
                                                    : 'border-blue-100 text-blue-500 hover:bg-blue-50'
                                            )}
                                        >
                                            {deans.enabled ? 'Deactivate' : 'Activate'}
                                        </button>
                                    {/if}
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

{#if schools}
    <Modal
        bind:show={openAddModal}
        heading='Add Dean'
        class='gap-y-0'
    >
        <InputText
            label='Email'
            placeholder='Enter email'
            bind:value={deanData.email.value}
            bind:error={deanData.email.error}
            onInput={(value) => {
                if (value.trim().length === 0) {
                    deanData.email.error = 'Email is required';
                } else if (!value.includes('@')) {
                    deanData.email.error = 'Invalid email address';
                } else {
                    deanData.email.error = '';
                }
            }}
        />
        <InputText
            label='First Name'
            placeholder='Enter first name'
            bind:value={deanData.first_name.value}
            bind:error={deanData.first_name.error}
            onInput={(value) => {
                if (value.trim().length === 0) {
                    deanData.first_name.error = 'First name is required';
                } else if (value.trim().length > 50) {
                    deanData.first_name.error = 'First name should not exceed 50 characters.';
                } else {
                    deanData.first_name.error = '';
                }
            }}
        />
        <InputText
            label='Middle Name'
            placeholder='Enter middle name'
            bind:value={deanData.middle_name.value}
            bind:error={deanData.middle_name.error}
            onInput={(value) => {
                if (value.trim().length > 50) {
                    deanData.middle_name.error = 'Middle name should not exceed 50 characters.';
                } else {
                    deanData.middle_name.error = '';
                }
            }}
        />
        <InputText
            label='Last Name'
            placeholder='Enter last name'
            bind:value={deanData.last_name.value}
            bind:error={deanData.last_name.error}
            onInput={(value) => {
                if (value.trim().length === 0) {
                    deanData.last_name.error = 'Last name is required';
                } else if (value.trim().length > 50) {
                    deanData.last_name.error = 'Last name should not exceed 50 characters.';
                } else {
                    deanData.last_name.error = '';
                }
            }}
        />

        <Dropdown
            label='School'
            bind:value={deanData.school_id.value}
        >
            {#each schools as school}
                <DropdownItem value={school.id} label={school.name}/>
            {/each}
        </Dropdown>
        
        <ButtonM
            Icon={Plus}
            label='Add'
            onclick={onAdd}
            class='mt-2'
        />
    </Modal>
{/if}