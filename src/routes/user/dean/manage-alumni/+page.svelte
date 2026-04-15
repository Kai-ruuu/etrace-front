<script>
    import Papa from "papaparse";
	import ButtonM from "$lib/components/global/ButtonM.svelte";
	import Dropdown from "$lib/components/global/Dropdown.svelte";
	import DropdownItem from "$lib/components/global/DropdownItem.svelte";
	import InputText from "$lib/components/global/InputText.svelte";
	import InputTextArea from "$lib/components/global/InputTextArea.svelte";
	import ConfirmModal from "$lib/components/global/modals/ConfirmModal.svelte";
	import Modal from "$lib/components/global/modals/Modal.svelte";
	import Pagination from "$lib/components/global/Pagination.svelte";
	import TextS from "$lib/components/global/TextS.svelte";
	import TextX from "$lib/components/global/TextX.svelte";
	import AdminHeader from "$lib/components/user/AdminHeader.svelte";
	import { apiUrl, get, patchJson, postJson } from "$lib/utils/api";
	import { capitalizeWords, error, formatDate, success } from "$lib/utils/ui";
	import { AlertCircle, Briefcase, Calendar, File, Info, Link, MapPin, MessageCircle, Pen, Plus, Search, Smartphone, X } from "lucide-svelte";
	import { onMount } from "svelte";
	import { twMerge } from "tailwind-merge";
	import JobAddressModal from "$lib/components/user/JobAddressModal.svelte";

    let query = $state('');
    let enabledFilter = $state(null);
    let statusFilter = $state(null);
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

    let courses = $state([]);

    let confirmDeact = $state({ item: null, show: false });
    let confirmReact = $state({ item: null, show: false });
    let confirmVerify = $state({ item: null, show: false });
    let confirmReject = $state({ item: null, show: false });
    let confirmPend = $state({ item: null, show: false });
    let rejectionMessage = $state({ value: '', error: '' });

    let openProfile = $state(false);
    let openedProfile = $state(null);
    let openAppeals = $state(false);
    let openAppealsProfile = $state(null);

    let openFindInRecords = $state(false);
    let formattedProfile = $state(null);
    let matches = $state([]);

    let openCvModal = $state(false);
    let openCvModalUrl = $state(null);

    let openMapModal = $state(false);
    let openMapModalAddress = $state(false);

    async function onSearch() {
        await get('/api/user/alumni', {
            query: {
                enabled: enabledFilter ?? '',
                status: statusFilter ?? '',
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
            onFail: async (newData) => error(newData?.message ?? 'Unable to fetch alumnis.'),
        });
    }

    async function onDeact(id) {
        await patchJson('/api/user/alumni/disable/' + id, null, {
            onSuccess: async (newData) => {
                confirmDeact.show = false;
                const index = data.results.findIndex((r) => r.id === newData.id);
                await onSearch();
            },
            onFail: async (newData) => error(newData?.message ?? 'Unable to deactivate Alumni.'),
        });
    }

    async function onReact(id) {
        await patchJson('/api/user/alumni/enable/' + id, null, {
            onSuccess: async (newData) => {
                confirmReact.show = false;
                const index = data.results.findIndex((r) => r.id === newData.id);
                await onSearch();
            },
            onFail: async (newData) => error(newData?.message ?? 'Unable to activate Alumni.'),
        });
    }

    async function onVerify() {
        await patchJson('/api/user/alumni/verify/' + confirmVerify.item?.id, null, {
            onSuccess: async (newData) => {
                success('Alumni has been verified.');
                confirmVerify.show = false;
                await onSearch();
            },
            onFail: async (err) => error(err?.message ?? 'Unable to verify alumni due to an error.'),
        });
    }

    async function onReject() {
        if (rejectionMessage.error || !rejectionMessage.value.trim()) {
            error('Cannot reject alumni yet.');
            return;
        }
        
        await patchJson('/api/user/alumni/reject/' + confirmReject.item?.id, 
            { message: rejectionMessage.value },
            {
                onSuccess: async (newData) => {
                    success('Alumni has been rejected.');
                    confirmReject.show = false;
                    openAppeals = false;
                    await onSearch();
                },
                onFail: async (err) => error(err?.message ?? 'Unable to reject alumni due to an error.'),
            }
        );
    }

    async function onPend() {
        await patchJson('/api/user/alumni/pend/' + confirmPend.item?.id, 
            { message: rejectionMessage.value },
            {
                onSuccess: async (newData) => {
                    success('Alumni has been marked as pending for verification.');
                    confirmPend.show = false;
                    openAppeals = false;
                    openAppealsProfile = null;
                    await onSearch();
                },
                onFail: async (err) => error(err?.message ?? 'Unable to mark alumni as pending due to an error.'),
            }
        );
    }

    async function onLoadProfile(id, forAppeal = false) {
        await get('/api/user/alumni/' + id,
            {
                onSuccess: async (_data) => {
                    if (forAppeal) {
                        openAppealsProfile = _data;
                        openAppeals = true;
                    } else {
                        openedProfile = _data;
                        openProfile = true;
                    }
                    console.log(_data);
                },
                onFail: async (err) => error(err?.message ?? forAppeal
                    ? 'Unable to fetch appeals.'
                    : 'Unable to fetch alumni profile.'
                )
            }
        );
    }

    function formatRows(rows) {
        return rows.map((r) => {
            const [month, day, year] = String(r["Birthdate"]).split("/");
            const birthDate = `${year}-${month}-${day}`;
            
            return {
                student_number: r["Student Number"],
                birth_date: birthDate,
                birth_place: r["Birthplace"],
                last_name: capitalizeWords(r["Last Name"]),
                first_name: capitalizeWords(r["First Name"]),
                middle_name: r["Middle Name"].toLowerCase() === "n/a" ? "" : capitalizeWords(r["Middle Name"]),
                gender: capitalizeWords(r["Gender"]),
                address: capitalizeWords(r["Full Address"]),
                phone_number: r["Contact Number"]
            };
        });
    }

    function formatProfile(alumni) {
        const p = alumni.profile;
        let [year, month, day] = p.birth_date.split("-");

        return {
            student_number: p.student_number,
            birth_date: `${year}-${parseInt(month)}-${parseInt(day)}`,
            birth_place: p.birth_place,
            last_name: p.last_name,
            first_name: p.name_extension
                ? (p.first_name + " " + p.name_extension)
                : p.first_name,
            middle_name: p.middle_name,
            gender: p.gender,
            address: p.address,
            phone_number: p.phone_number,
        };
    }

    function hasMatched(match, key) {
        return match.row[key].matched;
    }

    function getBgColor(match) {
        const percentage = match.match_percentage;

        if (percentage < 75) return "bg-red-100";
        if (percentage <= 100) return "bg-green-100";
    }

    async function onLoadRecord() {
        await get(`/api/institution/graduate-record/${openedProfile.profile.course_id}/${openedProfile.profile.graduation_year}`,
            {
                onSuccess: async (_data) => {
                    let content = Papa.parse(_data.content, {
                        header: true,
                        skipEmptyLines: true,
                    });

                    let prof = formatProfile(openedProfile);
                    let rows = formatRows(content.data);

                    formattedProfile = prof;

                    rows.forEach(r => {
                        const p = prof;
                        let rowScore = 0;
                        let rowMaxScore = Object.keys(p).length;
                        let formattedRow = {};

                        Object.entries(p).forEach(([key, value]) => {
                            const pVals = String(value).toLowerCase().split(" ");
                            const rVals = String(r[key]).toLowerCase().split(" ");

                            const hasMatch = pVals.some(pv => rVals.includes(pv));

                            rowScore += hasMatch ? 1 : 0;
                            formattedRow[key] = { value: r[key], matched: hasMatch };
                        });

                        matches.push({
                            row: formattedRow,
                            match_percentage: ((rowScore / rowMaxScore) * 100).toFixed(0)
                        });

                    });

                    matches.sort((a, b) => b.match_percentage - a.match_percentage);
                    
                    openFindInRecords = true;
                },
                onFail: async (err) => error(err?.message ?? 'Unable to fetch matching alumni record.')
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

<AdminHeader heading='Manage Alumni'/>

{#if openProfile}
    <div class="flex-1 min-h-0 space-y-2 overflow-y-hidden pt-0 bg-white flex flex-col items-stretch">
        <div class="w-full overflow-auto max-h-full scrollbar">
            <div class="flex flex-col overflow-clip">
                <div class="flex items-center justify-between p-4">
                    <div class="grow flex items-center gap-x-3">
                        <div 
                            style={`background-image: url(${apiUrl('/Uploads/alumni/profile_picture/' + openedProfile.profile.profile_picture)})`}
                            class="w-10 h-10 bg-cover bg-center rounded-full border border-gray-200"
                        ></div>
                        <h1 class='text-xl max-w-7/10 truncate flex items gap-x-3'>{openedProfile.profile.first_name}{openedProfile.profile.name_extension && ' ' + openedProfile.profile.name_extension}{openedProfile.profile.middle_name && ' ' + openedProfile.profile.middle_name} {openedProfile.profile.last_name}</h1>
                    </div>
                    <div class="flex items-center gap-x-2">
                        <button
                            onclick={onLoadRecord}
                            class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-blue-100 text-blue-500 hover:bg-blue-50"
                        >
                            Find In Records
                        </button>
                        <button
                            onclick={() => {
                                openProfile = false;
                                openedProfile = null
                            }}
                            class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-red-100 text-red-500 hover:bg-red-50"
                        >
                            Close
                        </button>
                    </div>
                </div>
                
                <div class="flex flex-col gap-y-2 p-4 border-t border-gray-100">
                    <TextS class='text-gray-700/75'>Employment Information</TextS>

                    <div class="grid grid-cols-3 gap-4">
                        <div class="flex flex-col items-stretch space-y-2">
                            <TextX class='font-bold text-gray-700/80'>Status</TextX>
                            {#if openedProfile.profile.employment_status === 'Employed'}
                                <span class="w-fit inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">
                                    Employed
                                </span>
                            {:else if openedProfile.profile.employment_status === 'Self-employed'}
                                <span class="w-fit inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">
                                    Self-employed
                                </span>
                            {:else}
                                <span class="w-fit inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-500">
                                    Unemployed
                                </span>
                            {/if}
                        </div>
    
                        <div class="flex flex-col items-stretch space-y-2 col-span-2">
                            <TextX class='font-bold text-gray-700/80'>Curriculum Vitae</TextX>
                            <button 
                                onclick={() => {
                                    openCvModalUrl = openedProfile.profile.cv;
                                    openCvModal = true;
                                }}
                                class="flex items-center gap-x-2 cursor-pointer"
                            >
                                <Link class='text-gray-600 w-4'/>
                                <TextS class='max-w-full truncate underline'>{openedProfile.profile.cv}</TextS>
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex flex-col items-stretch space-y-2">
                        <div class="flex flex-col gap-y-2">
                            <TextX class='font-bold text-gray-700/80'>Employment History</TextX>
                            <div class="max-h-full grid md:grid-cols-3 gap-x-4">
                                {#each openedProfile.profile.occupations as occ}
                                    <div class="flex items-center gap-x-3 rounded w-full p-2 border border-gray-100 hover:bg-gray-50 transition-colors">
                                        <div class="grow flex items-center gap-x-4">
                                            <div class="w-8 h-8 rounded flex items-center justify-center bg-gray-100">
                                                <Briefcase class='w-4 text-gray-600'/>
                                            </div>
                                            <div class="grow flex flex-col items-start">
                                                <TextS class='max-w-full truncate'>{occ.occupation.name}</TextS>
                                                <TextX class='text-gray-500 max-w-full truncate'>{occ.start_year} - {!occ.end_year ? 'Present' : occ.end_year} at <span class="font-bold">{occ.company}</span></TextX>
                                            </div>
                                        </div>
                                        <ButtonM
                                            Icon={MapPin}
                                            class='px-1 py-0'
                                            onclick={() => {
                                                openMapModalAddress = occ.address;
                                                openMapModal = true;
                                            }}
                                        />
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="flex flex-col gap-y-2 p-4 border-t border-gray-100">
                    <TextS class='text-gray-700/75'>Account Information</TextS>

                    <div class="flex flex-col items-stretch space-y-2">
                        <TextX class='font-bold text-gray-700/80'>Verification Status</TextX>
                        {#if openedProfile.profile.ver_stat_dean === 'Verified'}
                            <span class="w-fit inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">
                                Verified
                            </span>
                        {:else if openedProfile.profile.ver_stat_dean === 'Pending'}
                            <span class="w-fit inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-600">
                                Pending
                            </span>
                        {:else}
                            <span class="w-fit inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-500">
                                Rejected
                            </span>
                        {/if}
                    </div>
                </div>
        
                <div class="flex flex-col gap-y-2 p-4 border-t border-gray-100">
                    <TextS class='text-gray-700/75'>Personal Information</TextS>

                    <div class='grid grid-cols-3 gap-4'>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>First Name</TextX>
                            <TextS class='max-w-full truncate'>{openedProfile.profile.first_name}{openedProfile.profile.name_extension && ' ' + openedProfile.profile.name_extension}</TextS>
                        </div>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>Middle Name</TextX>
                            <TextS class='max-w-full truncate'>{openedProfile.profile.middle_name ? openedProfile.profile.middle_name : 'N/A'}</TextS>
                        </div>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>Last Name</TextX>
                            <TextS class='max-w-full truncate'>{openedProfile.profile.last_name}</TextS>
                        </div>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>Birth Date</TextX>
                            <TextS class='max-w-full truncate'>{formatDate(openedProfile.profile.birth_date)}</TextS>
                        </div>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>Birth Place</TextX>
                            <TextS class='max-w-full truncate'>{openedProfile.profile.birth_place}</TextS>
                        </div>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>Gender</TextX>
                            <TextS class='max-w-full truncate'>{openedProfile.profile.gender}</TextS>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-y-2 p-4 border-t border-gray-100">
                    <TextS class='text-gray-700/75'>Contact Information</TextS>

                    <div class="space-y-4">
                        <div class='grid grid-cols-3 gap-4'>
                            <div class="flex flex-col items-stretch space-y-1">
                                <TextX class='font-bold text-gray-700/80'>Email Address</TextX>
                                <TextS class='max-w-full truncate'>{openedProfile.email}</TextS>
                            </div>
                            <div class="flex flex-col items-stretch space-y-1">
                                <TextX class='font-bold text-gray-700/80'>Phone Number</TextX>
                                <TextS class='max-w-full truncate'>{openedProfile.profile.phone_number}</TextS>
                            </div>
                            <div class="flex flex-col items-stretch space-y-1">
                                <TextX class='font-bold text-gray-700/80'>Address</TextX>
                                <TextS class='max-w-full truncate'>{openedProfile.profile.address}</TextS>
                            </div>
                            <div class="flex flex-col items-stretch space-y-1 col-span-3">
                                <TextX class='font-bold text-gray-700/80'>Social Media:</TextX>
                                <div class="flex flex-col gap-y-2">
                                    {#each openedProfile.profile.social_medias as socmed}
                                        <a href={socmed.url} target="_blank" class="flex items-center gap-x-2">
                                            <Link class='text-gray-600 w-4'/>
                                            <TextS class='max-w-full truncate underline'>{socmed.platform.name}</TextS>
                                        </a>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-y-2 p-4 border-t border-gray-100">
                    <TextS class='text-gray-700/75'>Education Information</TextS>

                    <div class="space-y-4">
                        <div class='grid grid-cols-3 gap-4'>
                            <div class="flex flex-col items-stretch space-y-1">
                                <TextX class='font-bold text-gray-700/80'>Course</TextX>
                                <TextS class='max-w-full truncate'>{openedProfile.profile.course.name}</TextS>
                            </div>
                            <div class="flex flex-col items-stretch space-y-1">
                                <TextX class='font-bold text-gray-700/80'>Student Number</TextX>
                                <TextS class='max-w-full truncate'>{openedProfile.profile.student_number ? openedProfile.profile.student_number : 'N/A'}</TextS>
                            </div>
                            <div class="flex flex-col items-stretch space-y-1">
                                <TextX class='font-bold text-gray-700/80'>Batch</TextX>
                                <TextS class='max-w-full truncate'>{openedProfile.profile.graduation_year}</TextS>
                            </div>
                        </div>
                    </div>
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
                            style={`background-image: url(${apiUrl('/Uploads/alumni/profile_picture/' + openAppealsProfile.profile.profile_picture)})`}
                            class="w-10 h-10 bg-cover bg-center rounded-full border border-gray-200"
                        ></div>
                        <h1 class='text-xl max-w-7/10 truncate flex items gap-x-3'>{openAppealsProfile.profile.first_name}'s Appeal</h1>
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
                        <TextS>Rejected on: <span class="text-gray-600 font-bold">{formatDate(openAppealsProfile.profile.rejection_dean.created_at)}</span></TextS>
                    </div>
                    <div class="flex flex-col items-stretch">
                        <div class="flex items-center gap-x-2">
                            <AlertCircle class='w-4 text-red-900/65'/>
                            <TextS class='text-red-900'>Rejection reason:</TextS>
                        </div>
                        <div class="text-sm rounded text-gray-600 ml-6 pt-1">
                            {openAppealsProfile.profile.rejection_dean.message}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col gap-y-2 p-4 border-t border-gray-100">
                <div class="flex items-center justify-between">
                    <TextS class='text-gray-700/75'>Appeal Information</TextS>
                    {#if openAppealsProfile.profile.rejection_dean.appeal}
                        <button
                            Icon={X}
                            label='Close'
                            onclick={() => {
                                confirmPend.show = true;
                                confirmPend.item = openAppealsProfile;
                            }}
                            class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-blue-100 text-blue-500 hover:bg-blue-50"
                        >
                            Mark Alumni as Pending for Verification
                        </button>
                    {/if}
                </div>
                <div class="flex flex-col gap-y-2">
                    {#if openAppealsProfile.profile.rejection_dean.appeal}
                        <div class="flex items-center gap-x-2">
                            <Calendar class='w-4 text-gray-400'/>
                            <TextS>Appealed on: <span class="text-gray-600 font-bold">{formatDate(openAppealsProfile.profile.rejection_dean.appeal.created_at)}</span></TextS>
                        </div>
                        <div class="flex flex-col items-stretch">
                            <div class="flex items-center gap-x-2">
                                <MessageCircle class='w-4 text-gray-400'/>
                                <TextS class='text-gray-600'>Appeal:</TextS>
                            </div>
                            <div class="text-sm rounded text-gray-600 ml-6 pt-1">
                                {openAppealsProfile.profile.rejection_dean.appeal.message}
                            </div>
                        </div>
                    {:else}
                        <TextS>{openAppealsProfile.profile.first_name} has not appealed yet.</TextS>
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
                    bind:value={enabledFilter}
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
                    label='Course'
                    bind:value={courseFilter}
                    onChange={async () => {
                        data.page = 1;
                        await onSearch();
                    }}
                >
                    <DropdownItem value={null} label='All'/>
                    {#each courses as course}
                        <DropdownItem value={course.id} label={course.code}/>
                    {/each}
                </Dropdown>
                <Dropdown
                    label='Batch'
                    bind:value={batchFilter}
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
                    placeholder='Search alumni'
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
                            <th class="px-4 py-3 font-medium">Course</th>
                            <th class="px-4 py-3 font-medium">Batch</th>
                            <th class="px-4 py-3 font-medium">Status</th>
                            <th class="px-4 py-3 font-medium">Verification Status</th>
                            <th class="px-4 py-3 font-medium">Employment Status</th>
                            <th class="px-4 py-3 font-medium">Registered</th>
                            <th class="px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.results as alumni (alumni.id)}
                            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors **:text-nowrap">
                                <td class="px-4 py-3 text-gray-800">
                                    <div class="flex items-center gap-x-2">
                                        <div 
                                            style={`background-image: url(${apiUrl('/Uploads/alumni/profile_picture/' + alumni.profile.profile_picture)})`}
                                            class="w-8 h-8 bg-cover bg-center rounded-full border border-gray-200"
                                        ></div>
                                        <TextS>{alumni.profile.first_name}{alumni.profile.name_extension && ' ' + alumni.profile.name_extension}{alumni.profile.middle_name && ' ' + alumni.profile.middle_name} {alumni.profile.last_name}</TextS>
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-gray-800">{alumni.profile.course.code}</td>
                                <td class="px-4 py-3 text-gray-800">{alumni.profile.graduation_year}</td>
                                <td class="px-4 py-3">
                                    {#if alumni.enabled}
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
                                    {#if alumni.profile.ver_stat_dean === 'Verified'}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">
                                            Verified
                                        </span>
                                    {:else if alumni.profile.ver_stat_dean === 'Pending'}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-600">
                                            Pending
                                        </span>
                                    {:else}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-500">
                                            Rejected
                                        </span>
                                    {/if}
                                </td>
                                <td class="px-4 py-3">
                                    {#if alumni.profile.employment_status === 'Employed'}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">
                                            Employed
                                        </span>
                                    {:else if alumni.profile.employment_status === 'Self-employed'}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">
                                            Self-employed
                                        </span>
                                    {:else}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-500">
                                            Unemployed
                                        </span>
                                    {/if}
                                </td>
                                <td class="px-4 py-3 text-gray-500">{formatDate(alumni.created_at)}</td>
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-x-2">
                                        <button
                                            onclick={() => {
                                                if (alumni.enabled) {
                                                    confirmDeact.item = alumni;
                                                    confirmDeact.show = true;
                                                } else {
                                                    confirmReact.item = alumni;
                                                    confirmReact.show = true;
                                                }
                                            }}
                                            class={twMerge(
                                                "text-xs px-3 py-1 rounded border transition-colors cursor-pointer",
                                                alumni.enabled
                                                    ? 'border-red-100 text-red-500 hover:bg-red-50'
                                                    : 'border-blue-100 text-blue-500 hover:bg-blue-50'
                                            )}
                                        >
                                            {alumni.enabled ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onclick={async () => await onLoadProfile(alumni.id)}
                                            class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-blue-100 text-blue-500 hover:bg-blue-50"
                                        >
                                            View Profile
                                        </button>
                                        {#if alumni.profile.ver_stat_dean === 'Pending'}
                                            <button
                                                onclick={() => {
                                                    confirmVerify.item = alumni;
                                                    confirmVerify.show = true;
                                                }}
                                                class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-green-100 text-green-500 hover:bg-green-50"
                                            >
                                                Verify
                                            </button>
                                            <button
                                            onclick={() => {
                                                    confirmReject.item = alumni;
                                                    confirmReject.show = true;
                                                }}
                                                class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-red-100 text-red-500 hover:bg-red-50"
                                            >
                                                Reject
                                            </button>
                                        {:else if alumni.profile.ver_stat_dean === 'Rejected'}
                                            <button
                                                onclick={async () => await onLoadProfile(alumni.id, true)}
                                                class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-blue-100 text-blue-500 hover:bg-blue-50"
                                            >
                                                View Appeal
                                            </button>
                                        {/if}
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
{/if}

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

<ConfirmModal
    bind:show={confirmVerify.show}
    text={`Verify alumni?`}
    onConfirm={onVerify}
/>

<ConfirmModal
    bind:show={confirmPend.show}
    text={`Mark alumni as pending?`}
    onConfirm={onPend}
/>

<Modal
    show={confirmReject.show}
    heading='Alumni Rejection'
    class='gap-y-0'
>
    <TextS class='mt-4'>Please state your reason for rejecting the alumni.</TextS>

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

<Modal
    show={openFindInRecords}
    heading='Finding Alumni in Graduate Records'
    class='gap-y-4 md:min-w-2/3 h-full'
>
    <p class="text-sm text-amber-500 border border-amber-200 rounded-md px-4 py-2 mt-2">
        <span class="flex items-center gap-x-2 mb-2">
            <Info class="min-w-4 max-w-4"/>
            <span>Note</span>
        </span>
        <span>These match results are for reference purposes only. The matching is based on a <strong>word-similarity algorithm</strong> and may not be fully accurate. It is still recommended to verify the alumni's information against the actual records.</span>
    </p>
    {#if matches.length > 0}
        <div class="w-full overflow-auto rounded border border-gray-200 max-h-full max-w-full scrollbar h-full">
            <table class="w-full text-sm text-left">
                <thead>
                    <tr class="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide sticky top-0 z-10 *:text-nowrap">
                        <th class="px-4 py-3 font-medium">Match %</th>
                        <th class="px-4 py-3 font-medium">First Name</th>
                        <th class="px-4 py-3 font-medium">Middle Name</th>
                        <th class="px-4 py-3 font-medium">Last Name</th>
                        <th class="px-4 py-3 font-medium">Birthdate</th>
                        <th class="px-4 py-3 font-medium">Birthplace</th>
                        <th class="px-4 py-3 font-medium">Gender</th>
                        <th class="px-4 py-3 font-medium">Student Number</th>
                        <th class="px-4 py-3 font-medium">Contact Number</th>
                        <th class="px-4 py-3 font-medium">Address</th>
                    </tr>
                </thead>
                <tbody>
                    {#each matches as match}
                        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td class={twMerge("px-4 py-3 text-nowrap font-medium", getBgColor(match))}>{match.match_percentage}%</td>
                            <td class={twMerge("px-4 py-3 text-nowrap", hasMatched(match, "first_name") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>{match.row.first_name.value}</td>
                            <td class={twMerge("px-4 py-3 text-nowrap", hasMatched(match, "middle_name") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>{match.row.middle_name.value ? match.row.middle_name.value : "-"}</td>
                            <td class={twMerge("px-4 py-3 text-nowrap", hasMatched(match, "last_name") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>{match.row.last_name.value}</td>
                            <td class={twMerge("px-4 py-3 text-nowrap", hasMatched(match, "birth_date") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>{match.row.birth_date.value}</td>
                            <td class={twMerge("px-4 py-3 text-nowrap", hasMatched(match, "birth_place") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>{match.row.birth_place.value}</td>
                            <td class={twMerge("px-4 py-3 text-nowrap", hasMatched(match, "gender") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>{match.row.gender.value}</td>
                            <td class={twMerge("px-4 py-3 text-nowrap", hasMatched(match, "student_number") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>{match.row.student_number.value}</td>
                            <td class={twMerge("px-4 py-3 text-nowrap", hasMatched(match, "phone_number") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>{match.row.phone_number.value}</td>
                            <td class={twMerge("px-4 py-3 text-nowrap", hasMatched(match, "address") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>{match.row.address.value}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {:else}
        <div>The are no matching record rows to the alumni information.</div>
    {/if}
</Modal>

<Modal
    bind:show={openCvModal}
    heading={openCvModalUrl}
    class='md:w-2/3 h-full'
>
    <iframe
        frameborder="0"
        title="Alumni CV"
        src={apiUrl('/Uploads/alumni/cv/' + openCvModalUrl + '#toolbar=0&navpanes=0view=Fit')}
        class="scrollbar grow bg-white rounded-lg overflow-clip"
    >
    </iframe>
</Modal>

<Modal
    bind:show={openCvModal}
    heading={openCvModalUrl}
    class='md:w-2/3 h-full'
>
    <iframe
        frameborder="0"
        title="Alumni CV"
        src={apiUrl('/Uploads/alumni/cv/' + openCvModalUrl + '#toolbar=0&navpanes=0view=Fit')}
        class="scrollbar grow bg-white rounded-lg overflow-clip"
    >
    </iframe>
</Modal>

<JobAddressModal
    bind:show={openMapModal}
    address={openMapModalAddress}
/>