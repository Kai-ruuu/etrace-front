<script>
	import ButtonM from "$lib/components/global/ButtonM.svelte";
	import Dropdown from "$lib/components/global/Dropdown.svelte";
	import DropdownItem from "$lib/components/global/DropdownItem.svelte";
	import InputFile from "$lib/components/global/InputFile.svelte";
	import InputText from "$lib/components/global/InputText.svelte";
	import ConfirmModal from "$lib/components/global/modals/ConfirmModal.svelte";
	import Modal from "$lib/components/global/modals/Modal.svelte";
	import Pagination from "$lib/components/global/Pagination.svelte";
	import AdminHeader from "$lib/components/user/AdminHeader.svelte";
    import Papa from "papaparse";
	import { user } from "$lib/stores/user";
	import { apiUrl, get, patchJson, postForm, postJson } from "$lib/utils/api";
	import { capitalizeWords, error, formatDate, highlight, success } from "$lib/utils/ui";
	import { Plus, Search, X } from "lucide-svelte";
	import { onMount } from "svelte";
	import { twMerge } from "tailwind-merge";
	import TextM from "$lib/components/global/TextM.svelte";
	import TextL from "$lib/components/global/TextL.svelte";
	import TextS from "$lib/components/global/TextS.svelte";

    let query = $state('');
    let archivedFilter = $state(null);
    let courseFilter = $state(null);
    let batchFilter = $state(null);

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

    let openAddModal = $state(false);
    let openViewer = $state(false);
    let viewerQuery = $state('');
    let viewedInfo = $state(null);
    let viewedContent = $state(null);
    let results = $derived(
        (viewedContent?.data ?? null) !== null
        ? viewedContent.data.filter((alumni) => (
            String(alumni["First Name"]).toLowerCase().includes(viewerQuery.trim().toLowerCase()) ||
            String(alumni["Middle Name"]).toLowerCase().includes(viewerQuery.trim().toLowerCase()) ||
            String(alumni["Last Name"]).toLowerCase().includes(viewerQuery.trim().toLowerCase()) ||
            String(alumni["Birthdate"]).toLowerCase().includes(viewerQuery.trim().toLowerCase()) ||
            String(alumni["Birthplace"]).toLowerCase().includes(viewerQuery.trim().toLowerCase()) ||
            String(alumni["Gender"]).toLowerCase().includes(viewerQuery.trim().toLowerCase()) ||
            String(alumni["Student Number"]).toLowerCase().includes(viewerQuery.trim().toLowerCase()) ||
            String(alumni["Contact Number"]).toLowerCase().includes(viewerQuery.trim().toLowerCase()) ||
            String(alumni["Deceased"]).toLowerCase().includes(viewerQuery.trim().toLowerCase())
        )).sort((a, b) => String(a["First Name"]).localeCompare(String(b["First Name"])))
        : []
    );

    let recordData = $state({
        record: { value: null, error: '' },
        graduation_year: { value: (new Date()).getFullYear(), error: '' },
        course_id: { value: 0, error: '' },
    });

    let courses = $state([]);

    async function onSearch() {
        await get('/api/institution/graduate-record', {
            query: {
                archived: archivedFilter ?? '',
                course_id: courseFilter ?? '',
                batch: batchFilter ?? '',
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
            onFail: async (newData) => error(newData?.message ?? 'Unable to fetch records.'),
        });
    }

    async function onArchive(id) {
        await patchJson('/api/institution/graduate-record/archive/' + id, null, {
            onSuccess: async (newData) => {
                confirmArchive.show = false;
                const index = data.results.findIndex((r) => r.id === newData.id);

                if (index !== -1) {
                    Object.assign(data.results[index], newData);
                    data.results[index].updated_at = newData.updated_at;
                }
            },
            onFail: async (newData) => error(newData?.message ?? 'Unable to archive record.'),
        });
    }

    async function onRestore(id) {
        await patchJson('/api/institution/graduate-record/restore/' + id, null, {
            onSuccess: async (newData) => {
                console.log(newData);
                confirmRestore.show = false;
                const index = data.results.findIndex((r) => r.id === newData.id);
                
                if (index !== -1) {
                    Object.assign(data.results[index], newData);
                    data.results[index].updated_at = newData.updated_at;
                }
            },
            onFail: async (newData) => error(newData?.message ?? 'Unable to restore record.'),
        });
    }

    async function onAdd() {
        if (
            !recordData.record.value ||
            !recordData.graduation_year.value ||
            !recordData.course_id.value ||
            recordData.record.error ||
            recordData.graduation_year.error ||
            recordData.course_id.error
        ) {
            error('Cannot add record yet.');
            return;
        }

        const form = new FormData();
        form.append('record', recordData.record.value);
        form.append('graduation_year', recordData.graduation_year.value);
        form.append('course_id', recordData.course_id.value);

        await postForm('/api/institution/graduate-record', form, {
            onSuccess: async () => {
                openAddModal = false;
                success('Record has been added.');
                recordData.record = { value: null, error: '' };
                recordData.graduation_year = { value: (new Date()).getFullYear(), error: '' };
                recordData.course_id = { value: recordData.course_id.value, error: '' };
                await onSearch();
            },
            onFail: async (err) => await error(err?.message ?? 'Unable to add record due to an error.')
        });
    }

    async function onView(record) {
        openViewer = true;
        viewedInfo = record

        await get('/api/institution/graduate-record/' + record.id, {
            onSuccess: async (_data) => viewedContent = Papa.parse(_data.content, {
                header: true,
                skipEmptyLines: true,
            }),
            onFail: async (err) => error(err?.message ?? 'Unable to fetch record')
        })
    }

    onMount(async () => {
        await get('/api/institution/course/all-for-dean', {
            onSuccess: async (_data) => {
                courses = _data;
                if (courses.length > 0) {
                    recordData.course_id.value = _data[0].id;
                }
            },
            onFail: async (err) => error(err?.message ?? 'Unable to fetch courses.')
        });
        await onSearch();
    });
</script>

<AdminHeader heading='Manage Graduate Records'/>

{#if !openViewer}
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
                <Dropdown
                    label='Course'
                    bind:value={courseFilter}
                    onChange={async () => {
                        data.page = 1;
                        await onSearch();
                    }}
                >
                    <DropdownItem label='All' value={null}/>
                    {#each courses as course}
                        <DropdownItem label={course.code} value={course.id}/>
                    {/each}
                </Dropdown>
                <Dropdown
                    bind:value={batchFilter}
                    label='Batch'
                    onChange={async () => {
                        data.page = 1;
                        await onSearch();
                    }}
                >
                    <DropdownItem value={null} label='All'/>
                    {#each Array.from({ length: (new Date()).getFullYear() - 2006 }, (_, i) => i + 2007).reverse() as year}
                        <DropdownItem value={year} label={year}/>
                    {/each}
                </Dropdown>
                <InputText
                    label='Search'
                    placeholder='Search records'
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

        <div class="grow min-h-0 relative scrollbar">
            <div class="w-full overflow-auto rounded border border-gray-200 max-h-full max-w-[calc(75vw-32px)]">
                <table class="w-full text-sm text-left">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide sticky top-0 z-10 *:text-nowrap">
                            <th class="px-4 py-3 font-medium">File Name</th>
                            <th class="px-4 py-3 font-medium">Course</th>
                            <th class="px-4 py-3 font-medium">Batch</th>
                            <th class="px-4 py-3 font-medium">Uploader</th>
                            <th class="px-4 py-3 font-medium">Status</th>
                            <th class="px-4 py-3 font-medium">Created</th>
                            <th class="px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.results as record (record.id)}
                            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors **:text-nowrap">
                                <td class="px-4 py-3 text-gray-800">{record.filename}</td>
                                <td class="px-4 py-3 text-gray-800">{record.course.code}</td>
                                <td class="px-4 py-3 text-gray-800">{record.graduation_year}</td>
                                <td class="px-4 py-3 text-gray-800">{record.dean_uploader.user_id === $user.id ? 'You' : `${record.dean_uploader.first_name} ${record.dean_uploader.last_name}`}</td>
                                <td class="px-4 py-3">
                                    {#if record.archived}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-500">
                                            Archived
                                        </span>
                                    {:else}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">
                                            Active
                                        </span>
                                    {/if}
                                </td>
                                <td class="px-4 py-3 text-gray-500">{formatDate(record.created_at)}</td>
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-x-2">
                                        <button
                                            onclick={async () => await onView(record)}
                                            class="text-xs px-3 py-1 rounded border border-blue-100 text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                                        >
                                            View
                                        </button>
                                        <button
                                            onclick={() => {
                                                if (record.archived) {
                                                    confirmRestore.item = record;
                                                    confirmRestore.show = true;
                                                } else {
                                                    confirmArchive.item = record;
                                                    confirmArchive.show = true;
                                                }
                                            }}
                                            class={twMerge(
                                                "text-xs px-3 py-1 rounded border transition-colors cursor-pointer",
                                                record.archived
                                                    ? 'border-blue-100 text-blue-500 hover:bg-blue-50'
                                                    : 'border-red-100 text-red-500 hover:bg-red-50'
                                            )}
                                        >
                                            {record.archived ? 'Restore' : 'Archive'}
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
{:else}
    <div class="flex-1 min-h-0 space-y-0 overflow-y-hidden px-4 pt-0 bg-white flex flex-col items-stretch">
        <div class="flex items-center justify-between mt-4">
            <TextM class='text-blue-900/65 font-bold'>Viewing {viewedInfo.filename} of Batch {viewedInfo.graduation_year}</TextM>
            <ButtonM
                Icon={X}
                onclick={() => {
                    openViewer = false;
                    viewedInfo = null;
                    viewedContent = null;
                }}
                class='p-2 py-1'
            />
        </div>
    
        <div class="flex items-end gap-x-4">
            <div class="flex items-end gap-x-4 grow">
                <InputText
                    label='Search'
                    placeholder='Search alumni'
                    bind:value={viewerQuery}
                    class='grow'
                    allowClear={true}
                    onInput={(value) => {

                    }}
                />
            </div>
        </div>

        <div class="grow min-h-0 relative scrollbar mt-2">
            <div class="w-full overflow-auto rounded border border-gray-200 max-h-full max-w-[calc(75vw-32px)]">
                <table class="w-full text-sm text-left">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide sticky top-0 z-10 *:text-nowrap">
                            <th class="px-4 py-3 font-medium">First Name</th>
                            <th class="px-4 py-3 font-medium">Middle Name</th>
                            <th class="px-4 py-3 font-medium">Last Name</th>
                            <th class="px-4 py-3 font-medium">Birthdate</th>
                            <th class="px-4 py-3 font-medium">Birthplace</th>
                            <th class="px-4 py-3 font-medium">Gender</th>
                            <th class="px-4 py-3 font-medium">Student Number</th>
                            <th class="px-4 py-3 font-medium">Contact Number</th>
                            <th class="px-4 py-3 font-medium">Deceased</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each results as alumni}
                            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors **:text-nowrap">
                                <td class="px-4 py-3 text-gray-800">{@html highlight(capitalizeWords(alumni["First Name"]), viewerQuery)}</td>
                                <td class="px-4 py-3 text-gray-800">{@html highlight((alumni["Middle Name"] && alumni["Middle Name"] !== "N/A") ? capitalizeWords(alumni["Middle Name"]) : "-", viewerQuery)}</td>
                                <td class="px-4 py-3 text-gray-800">{@html highlight(capitalizeWords(alumni["Last Name"]), viewerQuery)}</td>
                                <td class="px-4 py-3 text-gray-800">{@html highlight(capitalizeWords(alumni["Birthdate"]), viewerQuery)}</td>
                                <td class="px-4 py-3 text-gray-800">{@html highlight(capitalizeWords(alumni["Birthplace"]), viewerQuery)}</td>
                                <td class="px-4 py-3 text-gray-800">{@html highlight(capitalizeWords(alumni["Gender"]), viewerQuery)}</td>
                                <td class="px-4 py-3 text-gray-800">{@html highlight(capitalizeWords(alumni["Student Number"]), viewerQuery)}</td>
                                <td class="px-4 py-3 text-gray-800">{@html highlight(capitalizeWords(alumni["Contact Number"]), viewerQuery)}</td>
                                <td class="px-4 py-3 text-gray-800">{@html highlight(capitalizeWords(alumni["Deceased"]), viewerQuery)}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
{/if}

<ConfirmModal
    bind:show={confirmArchive.show}
    text={`Archive ${confirmArchive.item?.filename}?`}
    onConfirm={async () => onArchive(confirmArchive.item.id)}
/>

<ConfirmModal
    bind:show={confirmRestore.show}
    text={`Restore ${confirmRestore.item?.filename}?`}
    onConfirm={async () => onRestore(confirmRestore.item.id)}
/>

<Modal
    bind:show={openAddModal}
    heading='Add Record'
    class='gap-y-0'
>
    <InputFile
        label='Record File'
        placeholder={(new Date()).getFullYear() + "_Record.csv"}
        accept={['.csv']}
        bind:value={recordData.record.value}
        bind:error={recordData.record.error}
        onChange={(value) => recordData.record.error = !value ? 'Record file is required' : ''}
    />
    <Dropdown
        bind:value={recordData.graduation_year.value}
        label='Batch'
    >
        {#each Array.from({ length: (new Date()).getFullYear() - 2006 }, (_, i) => i + 2007).reverse() as year}
            <DropdownItem value={year} label={year}/>
        {/each}
    </Dropdown>
    <Dropdown
        bind:value={recordData.course_id.value}
        label='Course'
    >
        {#each courses as course}
            <DropdownItem value={course.id} label={course.name}/>
        {/each}
    </Dropdown>
    <TextS class='text-center my-2'>Don't have the template yet? Download it by clicking <a href={apiUrl('/Public/template.csv')} class="underline text-blue-900">here</a>.</TextS>
    <ButtonM
        Icon={Plus}
        label='Add'
        onclick={onAdd}
        class='mt-2'
    />
</Modal>