<script>
	import ButtonM from "$lib/components/global/ButtonM.svelte";
	import Dropdown from "$lib/components/global/Dropdown.svelte";
	import DropdownItem from "$lib/components/global/DropdownItem.svelte";
	import InputText from "$lib/components/global/InputText.svelte";
	import ConfirmModal from "$lib/components/global/modals/ConfirmModal.svelte";
	import Modal from "$lib/components/global/modals/Modal.svelte";
	import Pagination from "$lib/components/global/Pagination.svelte";
	import AdminHeader from "$lib/components/user/AdminHeader.svelte";
	import { deleteJson, get, patchJson, postJson, queryToString } from "$lib/utils/api";
	import { error, formatDate, success } from "$lib/utils/ui";
	import { Pen, Plus, Search } from "lucide-svelte";
	import { onMount } from "svelte";
	import { twMerge } from "tailwind-merge";

    let query = $state('');
    let alignedFilter = $state(false);
    let courseFilter = $state(null);

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

    let courses = $state([]);

    let confirmUnalign = $state({ item: null, show: false })
    let confirmAlign = $state({ item: null, show: false })

    async function onSearch() {
        await get('/api/institution/occupation', {
            query: {
                aligned: alignedFilter,
                course_id: courseFilter,
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
            onFail: async (newData) => error(newData?.message ?? 'Unable to fetch occupations.'),
        });
    }

    async function onUnalign(id) {
        await deleteJson('/api/institution/course-occupation',
            { course_id: courseFilter, occupation_id: id }, 
            {
                onSuccess: async (newData) => {
                    confirmUnalign.show = false;
                    await onSearch();
                },
                onFail: async (newData) => error(newData?.message ?? 'Unable to unalign occupation to course.'),
            }
        );
    }

    async function onAlign(id) {
        await postJson('/api/institution/course-occupation',
            { course_id: courseFilter, occupation_id: id }, 
            {
                onSuccess: async (newData) => {
                    confirmAlign.show = false;
                    await onSearch();
                },
                onFail: async (newData) => error(newData?.message ?? 'Unable to align occupation to course.'),
            }
        );
    }

    onMount(async () => {
        await get('/api/institution/course/all-for-dean', {
            onSuccess: async (_data) => {
                courses = _data;

                if (_data.length > 0) courseFilter = _data[0].id;
            },
            onFail: async (err) => error(err?.message ?? 'Unable to fetch courses.')
        });
        await onSearch();
    });
</script>

<AdminHeader heading='Manage Occupations'/>

<div class="flex-1 min-h-0 space-y-2 overflow-y-hidden px-4 pt-0 bg-white flex flex-col items-stretch">
    <div class="flex items-end gap-x-4">
        <div class="flex items-end gap-x-4 grow">
            <Dropdown
                label='Status'
                bind:value={alignedFilter}
                onChange={async () => {
                    data.page = 1;
                    await onSearch();
                }}
            >
                <DropdownItem label='Aligned' value={true}/>
                <DropdownItem label='Not Aligned' value={false}/>
            </Dropdown>
            <Dropdown
                label='Course'
                bind:value={courseFilter}
                onChange={async () => {
                    data.page = 1;
                    await onSearch();
                }}
            >
                {#each courses as course}
                    <DropdownItem value={course.id} label={course.code}/>
                {/each}
            </Dropdown>
            <InputText
                label='Search'
                placeholder='Search occupations'
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
                        <th class="px-4 py-3 font-medium">Added</th>
                        <th class="px-4 py-3 font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each data.results as occupation (occupation.id)}
                        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors **:text-nowrap">
                            <td class="px-4 py-3 text-gray-800">{occupation.name}</td>
                            <td class="px-4 py-3 text-gray-500">{formatDate(occupation.created_at)}</td>
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-x-2">
                                    {#if !alignedFilter}
                                        <a
                                            href={`https://www.google.com/search?${queryToString({ q: `Is ${occupation.name} aligned to the course ${courses.find((c) => c.id === courseFilter).name}` })}`}
                                            class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-blue-100 text-blue-500 hover:bg-blue-50"
                                        >
                                            Web Search
                                        </a>
                                    {/if}
                                    <button
                                        onclick={() => {
                                            if (alignedFilter) {
                                                confirmUnalign.item = occupation;
                                                confirmUnalign.show = true;
                                            } else {
                                                confirmAlign.item = occupation;
                                                confirmAlign.show = true;
                                            }
                                        }}
                                        class={twMerge(
                                            "text-xs px-3 py-1 rounded border transition-colors cursor-pointer",
                                            alignedFilter
                                                ? 'border-red-100 text-red-500 hover:bg-red-50'
                                                : 'border-blue-100 text-green-500 hover:bg-green-50'
                                        )}
                                    >
                                        {`${alignedFilter ? 'Unalign' : 'Align'} to ${courses.find((c) => c.id === courseFilter).code}`}
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
    bind:show={confirmUnalign.show}
    text={`Unalign ${confirmUnalign.item?.name} to ${courses.find((c) => c.id === courseFilter)?.name}?`}
    onConfirm={async () => onUnalign(confirmUnalign.item.id)}
/>

<ConfirmModal
    bind:show={confirmAlign.show}
    text={`Align ${confirmAlign.item?.name} to ${courses.find((c) => c.id === courseFilter)?.name}?`}
    onConfirm={async () => onAlign(confirmAlign.item.id)}
/>