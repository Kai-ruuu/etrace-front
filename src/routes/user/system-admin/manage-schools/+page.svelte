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
	import { Pen, Plus, Search } from "lucide-svelte";
	import { onMount } from "svelte";
	import { twMerge } from "tailwind-merge";

    let query = $state('');
    let archivedFilter = $state(null);

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

    let confirmArchive = $state({ item: null, show: false })
    let confirmRestore = $state({ item: null, show: false })
    let confirmEdit = $state({ item: null, show: false })

    let openAddModal = $state(false);

    let schoolName = $state({ value: '', error: '' });
    let schoolNewName = $state({ value: '', error: '' });

    async function onSearch() {
        await get('/api/institution/school', {
            query: {
                archived: archivedFilter ?? '',
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
                console.log(newData)
            },
            onFail: async (newData) => error(newData?.message ?? 'Unable to fetch schools.'),
        });
    }

    async function onArchive(id) {
        await patchJson('/api/institution/school/archive/' + id, null, {
            onSuccess: async (newData) => {
                confirmArchive.show = false;
                const index = data.results.findIndex((r) => r.id === newData.id);

                if (index !== -1) {
                    Object.assign(data.results[index], newData);
                    data.results[index].updated_at = newData.updated_at;
                }
            },
            onFail: async (newData) => error(newData?.message ?? 'Unable to archive school.'),
        });
    }

    async function onRestore(id) {
        await patchJson('/api/institution/school/restore/' + id, null, {
            onSuccess: async (newData) => {
                console.log(newData);
                confirmRestore.show = false;
                const index = data.results.findIndex((r) => r.id === newData.id);
                
                if (index !== -1) {
                    Object.assign(data.results[index], newData);
                    data.results[index].updated_at = newData.updated_at;
                }
            },
            onFail: async (newData) => error(newData?.message ?? 'Unable to restore school.'),
        });
    }

    async function onAdd() {
        if (schoolName.error || !schoolName.value.trim()) {
            error('Cannot add school yet.');
            return;
        }

        await postJson('/api/institution/school', {
            name: schoolName.value 
        }, {
            onSuccess: async () => {
                openAddModal = false;
                success(schoolName.value + ' has been added.');
                schoolName = { value: '', error: '' };
                await onSearch();
            },
            onFail: async (err) => await error(err?.message ?? 'Unable to add school due to an error.')
        });
    }

    async function onEdit() {
        if (schoolNewName.error || !schoolNewName.value.trim()) {
            error('Cannot edit school yet.');
            return;
        }

        await patchJson('/api/institution/school/edit/' + confirmEdit.item.id,
            { name: schoolNewName.value },
            {
                onSuccess: async () => {
                    confirmEdit.show = false;
                    success(confirmEdit.item.name + ' has been renamed as ' + schoolNewName.value + '.');
                    schoolNewName = { value: '', error: '' };
                    await onSearch();
                },
                onFail: async (err) => await error(err?.message ?? 'Unable to edit school due to an error.')
            }
        );
    }

    onMount(onSearch)
</script>

<AdminHeader heading='Manage Schools'/>

<div class="flex-1 min-h-0 space-y-2 overflow-y-hidden px-4 pt-0 bg-white flex flex-col items-stretch">
    <div class="flex items-end gap-x-4">
        <div class="flex items-end gap-x-4 grow">
            <Dropdown
                label='Status'
                bind:value={archivedFilter}
                onChange={async () => {
                    data.page = 1;
                    await onSearch();
                }}
            >
                <DropdownItem label='All' value={null}/>
                <DropdownItem label='Active' value={false}/>
                <DropdownItem label='Archived' value={true}/>
            </Dropdown>
            <InputText
                label='Search'
                placeholder='Search schools'
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
            Icon={Plus}
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
                        <th class="px-4 py-3 font-medium">Name</th>
                        <th class="px-4 py-3 font-medium">Status</th>
                        <th class="px-4 py-3 font-medium">Created</th>
                        <th class="px-4 py-3 font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each data.results as school (school.id)}
                        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors **:text-nowrap">
                            <td class="px-4 py-3 text-gray-800">{school.name}</td>
                            <td class="px-4 py-3">
                                {#if school.archived}
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-500">
                                        Archived
                                    </span>
                                {:else}
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">
                                        Active
                                    </span>
                                {/if}
                            </td>
                            <td class="px-4 py-3 text-gray-500">{formatDate(school.created_at)}</td>
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-x-2">
                                    {#if !school.archived}
                                        <button
                                            onclick={() => {
                                                confirmEdit.item = school;
                                                confirmEdit.show = true;
                                                schoolNewName.value = school.name;
                                            }}
                                            class="text-xs px-3 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                                        >
                                            Edit
                                        </button>
                                    {/if}
                                    <button
                                        onclick={() => {
                                            if (school.archived) {
                                                confirmRestore.item = school;
                                                confirmRestore.show = true;
                                            } else {
                                                confirmArchive.item = school;
                                                confirmArchive.show = true;
                                            }
                                        }}
                                        class={twMerge(
                                            "text-xs px-3 py-1 rounded border transition-colors cursor-pointer",
                                            school.archived
                                                ? 'border-blue-100 text-blue-500 hover:bg-blue-50'
                                                : 'border-red-100 text-red-500 hover:bg-red-50'
                                        )}
                                    >
                                        {school.archived ? 'Restore' : 'Archive'}
                                    </button>
                                </div>
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
    bind:show={confirmArchive.show}
    text={`Archive ${confirmArchive.item?.name}?`}
    onConfirm={async () => onArchive(confirmArchive.item.id)}
/>

<ConfirmModal
    bind:show={confirmRestore.show}
    text={`Restore ${confirmRestore.item?.name}?`}
    onConfirm={async () => onRestore(confirmRestore.item.id)}
/>

<Modal
    bind:show={openAddModal}
    heading='Add School'
>
    <InputText
        label='Name'
        placeholder='Enter school name'
        bind:value={schoolName.value}
        bind:error={schoolName.error}
        onInput={(value) => schoolName.error = value.trim() ? '' : 'Name is required.'}
    />
    <ButtonM
        Icon={Plus}
        label='Add'
        onclick={onAdd}
    />
</Modal>

<Modal
    bind:show={confirmEdit.show}
    heading='Edit School'
>
    <InputText
        label='Name'
        placeholder="Enter school's new name"
        bind:value={schoolNewName.value}
        bind:error={schoolNewName.error}
        onInput={(value) => schoolNewName.error = value.trim() ? '' : 'Name is required.'}
    />
    <ButtonM
        Icon={Pen}
        label='Edit'
        onclick={onEdit}
    />
</Modal>