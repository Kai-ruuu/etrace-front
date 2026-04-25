<script>
	import { goto } from "$app/navigation";
	import ButtonM from "$lib/components/global/ButtonM.svelte";
	import Modal from "$lib/components/global/modals/Modal.svelte";
	import RoundedCard from "$lib/components/global/RoundedCard.svelte";
	import SidebarLink from "$lib/components/global/SidebarLink.svelte";
	import TextM from "$lib/components/global/TextM.svelte";
	import TextS from "$lib/components/global/TextS.svelte";
	import TextX from "$lib/components/global/TextX.svelte";
	import AlumniHeader from "$lib/components/user/AlumniHeader.svelte";
	import VerificationPanel from "$lib/components/user/VerificationPanel.svelte";
	import { user } from "$lib/stores/user";
	import { apiUrl, deleteJson, geocode, get, postJson } from "$lib/utils/api";
	import { error, formatDate, formatNumber, success } from "$lib/utils/ui";
	import { BadgeCheck, Book, Briefcase, Calendar, CheckCircle, ChevronRight, CircleDollarSign, File, GraduationCap, Info, Link, LogOut, Mail, MapPin, Monitor, Phone, Scroll, Settings, Share, Smartphone, SunMoon, ThumbsUp, Upload, User, UserSearch, X } from "lucide-svelte";
	import { onMount } from "svelte";
	import { twMerge } from "tailwind-merge";

    let selectedCareerId = $state(null)
    let query = $state('');
    let isFetching = $state(false);
    let sentinelEl = $state(null);

    let data = $state({
        results: [],
        total: 0,
        page: 1,
        per_page: 20,
        total_pages: 0,
        has_next: false,
        has_prev: false,
    });

    let marker = $state(null);
    let map = $state(null);
	let mapErrMsg = $state("");
	let mapLoading = $state(false);

    let submissions = $state([]);
    let openSubmissions = $state(false);

    let likes = $state([]);
    let openLikes = $state(false);

    let post = $state(null);
    let openPost = $state(false);

    let openVercent = $state(false);

    let openProfile = $state(false);
    let openCvModal = $state(false);
    let openCvModalUrl = $state(null);

    async function fetchPage(page, append = false) {
        if (isFetching) return;
        isFetching = true;

        await get('/api/job-post/for-alumni', {
            query: {
                query,
                page,
                per_page: data.per_page,
            },
            onSuccess: async (newData) => {
                data.results = append ? [...data.results, ...newData.results] : newData.results;
                data.total = newData.total;
                data.page = newData.page;
                data.per_page = newData.per_page;
                data.total_pages = newData.total_pages;
                data.has_next = newData.has_next;
                data.has_prev = newData.has_prev;
            },
            onFail: async (newData) => error(newData?.message ?? 'Unable to fetch Companies.'),
        });

        isFetching = false;
    }

    async function onSearch() {
        if ($user.profile.ver_stat_dean !== 'Verified')
            return;
        
        data.page = 1;
        data.results = [];
        await fetchPage(1, false);
    }

    async function loadMore() {
        if (!data.has_next || isFetching) return;
        await fetchPage(data.page + 1, true);
    }

    async function onLogout() {
        await get('/api/auth', {
            onSuccess: async (data) => {
                success(data?.message ?? 'Logged out successfully!');
                goto('/', { replaceState: true });
            },
            onFail: async (data) => {
                error(data?.message ?? 'Unable to logout properly.');
                goto('/', { replaceState: true });
            }
        });
    }

    async function onLike(id) {
        await postJson('/api/job-post-like/' + id, null, {
            onSuccess: async (_data) => data.results = [...data.results.map((p) => ({ ...p, likes: p.likes + 1, is_liked: true }))],
            onFail: async (err) => error(err?.message ?? 'Unable to like post due to an error.')
        });
    }

    async function onDisike(id) {
        await deleteJson('/api/job-post-like/' + id, null, {
            onSuccess: async (_data) => data.results = [...data.results.map((p) => ({ ...p, likes: p.likes - 1, is_liked: false }))],
            onFail: async (err) => error(err?.message ?? 'Unable to dislike post due to an error.')
        });
    }

    async function onSubmitCv(id) {
        await postJson('/api/job-post-submission/' + id, null, {
            onSuccess: async (_data) => data.results = [...data.results.map((p) => ({ ...p, submissions: p.submissions + 1, is_submitted: true }))],
            onFail: async (err) => error(err?.message ?? 'Unable to submit CV due to an error.')
        });
    }

    async function onUnsubmitCv(id) {
        await deleteJson('/api/job-post-submission/' + id, null, {
            onSuccess: async (_data) => data.results = [...data.results.map((p) => ({ ...p, submissions: p.submissions - 1, is_submitted: false }))],
            onFail: async (err) => error(err?.message ?? 'Unable to unsubmit CV due to an error.')
        });
    }

    async function onGeocodeCareerAddress(occupation) {
        mapLoading = true;
		
		try {
            const data = await geocode(occupation.address);

			if (typeof data === "string") {
				mapErrMsg = data;
				return;
			}

			const [latitude, longitude, displayName] = data;

            marker?.remove();
            
            const L = (await import('leaflet')).default;
            await import('leaflet/dist/leaflet.css');

			if (map) {
				map.remove();
				map = null;
				marker = null;
			}
    
            map = L.map('map', { zoomControl: false }).setView([latitude, longitude], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            marker = L.marker([latitude, longitude]).addTo(map);

            map.flyTo([latitude, longitude], 15, { animate: true, duration: 1.2 });
        } catch (error) {
            console.error(error);
        } finally {
			mapLoading = false;
		}
    }

    async function onLoadSubmissions() {
		await get('/api/job-post-submission/for-alumni', {
			onSuccess: async (_data) => {
				submissions = _data;
				openSubmissions = true;
			},
			onFail: async (err) => error('Unable to fetch CV submissions due to an error.')
		});
	}

    async function onLoadLikes() {
		await get('/api/job-post-like', {
			onSuccess: async (_data) => {
				likes = _data;
				openLikes = true;
			},
			onFail: async (err) => error('Unable to fetch liked posts due to an error.')
		});
	}

    onMount(async () => {
        await onSearch();

        let careers = $user.profile.occupations;

        if (careers.length > 0) {
            selectedCareerId = careers[0].id;
            await onGeocodeCareerAddress(careers[0]);
        }


        // Set up IntersectionObserver on the sentinel element
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (sentinelEl) observer.observe(sentinelEl);

        return () => observer.disconnect();
    });
</script>

<AlumniHeader bind:query={query} {onSearch}/>

<div class="flex-1 min-h-0 space-y-2 overflow-y-hidden px-4 pt-4 pb-2 bg-white/25 grid grid-cols-16 gap-4">
    <div class="grow min-h-0 relative col-span-4">
        <div class="w-full flex flex-col items-stretch gap-4 overflow-auto h-full">
            <RoundedCard class='flex-3 flex flex-col h-full min-h-0 overflow-auto scrollbar-hidden'> 
                <div class="flex-1 overflow-y-auto scrollbar-hidden pr-1 space-y-2">
                    <div class="flex items-center gap-x-3">
                        <div 
                            style={`background-image: url(${apiUrl('/Uploads/alumni/profile_picture/' + $user.profile.profile_picture)})`}
                            class="min-w-12 min-h-12 bg-cover bg-center rounded-full border border-gray-200"
                        ></div>
                        <div>
                            <TextS class='max-w-full truncate font-bold text-gray-700/80'>{$user.profile.first_name}{$user.profile.name_extension && ' ' + $user.profile.name_extension}{$user.profile.middle_name && ' ' + $user.profile.middle_name} {$user.profile.last_name}</TextS>
                            <TextS class='max-w-full truncate'>{$user.email}</TextS>
                        </div>
                    </div>
                    <div class="flex items-center gap-x-3 mt-6">
                        <div class="min-w-8 h-8 rounded flex items-center justify-center bg-gray-100">
                            <BadgeCheck class='w-4 text-gray-600'/>
                        </div>
                        <TextS class='max-w-full truncate'>{$user.profile.ver_stat_dean}</TextS>
                    </div>
                    <div class="flex items-center gap-x-3">
                        <div class="min-w-8 h-8 rounded flex items-center justify-center bg-gray-100">
                            <Briefcase class='w-4 text-gray-600'/>
                        </div>
                        <TextS class='max-w-full truncate'>{$user.profile.employment_status}</TextS>
                    </div>
                    <div class="flex items-center gap-x-3">
                        <div class="min-w-8 h-8 rounded flex items-center justify-center bg-gray-100">
                            <Phone class='w-4 text-gray-600'/>
                        </div>
                        <TextS class='max-w-full truncate'>{$user.profile.phone_number}</TextS>
                    </div>
                    <div class="flex items-center gap-x-3">
                        <div class="min-w-8 h-8 rounded flex items-center justify-center bg-gray-100">
                            <GraduationCap class='w-4 text-gray-600'/>
                        </div>
                        <TextS class='max-w-full truncate'>{$user.profile.course.name}</TextS>
                    </div>
                    <ButtonM
                        Icon={ChevronRight}
                        label='View Profile'
                        iconRight={true}
                        onclick={() => openProfile = true}
                        class='w-full bg-transparent border border-blue-900/50 text-blue-900'
                    />
                </div>
            </RoundedCard>
            <RoundedCard class='p-4'>
                <button
                    onclick={async () => await onLoadSubmissions()}
                    class="flex items-center gap-x-3 p-2 cursor-pointer w-full hover:bg-gray-100 transition-colors rounded"
                >
                    <File class='w-4 text-gray-500'/>
                    <TextS>CV Submissions</TextS>
                </button>
                <button
                    onclick={async () => await onLoadLikes()}
                    class="flex items-center gap-x-3 p-2 cursor-pointer w-full hover:bg-gray-100 transition-colors rounded"
                >
                    <ThumbsUp class='w-4 text-gray-500'/>
                    <TextS>Liked Posts</TextS>
                </button>
                <button
                    onclick={() => goto('/user/alumni/settings', { replaceState: true })}
                    class="flex items-center gap-x-3 p-2 cursor-pointer w-full hover:bg-gray-100 transition-colors rounded"
                >
                    <Settings class='w-4 text-gray-500'/>
                    <TextS>Settings</TextS>
                </button>
                <button
                    onclick={onLogout}
                    class="flex items-center gap-x-3 p-2 cursor-pointer w-full hover:bg-gray-100 transition-colors rounded"
                >
                    <LogOut class='w-4 text-gray-500'/>
                    <TextS>Logout</TextS>
                </button>
            </RoundedCard>
        </div>
    </div>

    {#if $user.profile.ver_stat_dean === 'Verified'}
        <div class="grow min-h-0 relative col-span-8">
            <div class="w-full overflow-auto h-full max-h-full scrollbar-hidden space-y-4">
                {#each data.results as post}
                    <RoundedCard class='flex flex-col items-stretch gap-y-4 p-0'>
                        <div class="flex items-center justify-between px-6 pt-4">
                            <div class="flex items-center gap-x-3">
                                <div 
                                    style={`background-image: url(${apiUrl('/Uploads/company/logo/' + post.company.logo)})`}
                                    class="w-8 h-8 bg-cover bg-center rounded-full border border-gray-200"
                                ></div>
                                <div class="flex flex-col">
                                    <TextM class='max-w-full truncate'>{post.company.name}</TextM>
                                    <TextX>{formatDate(post.created_at)}</TextX>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col items-stretch gap-y-1 px-6 border-t border-gray-100">
                            <TextS class='py-2 font-bold text-gray-700/80'>Looking for {post.position} ({post.slots} {post.slots > 1 ? 'slots' : 'slot'})</TextS>
                            <div class="flex items-center gap-x-2">
                                <div class="flex items-center gap-x-2 bg-green-50 text-green-900 px-2 py-1 rounded">
                                    <Scroll class='w-4'/>
                                    <TextS>{post.work_employment_type}</TextS>
                                </div>
                                <div class="flex items-center gap-x-2 bg-yellow-50 text-yellow-900 px-2 py-1 rounded">
                                    <SunMoon class='w-4'/>
                                    <TextS>{post.work_shift}</TextS>
                                </div>
                                <div class="flex items-center gap-x-2 bg-blue-50 text-blue-900 px-2 py-1 rounded">
                                    <Monitor class='w-4'/>
                                    <TextS>{post.work_setup}</TextS>
                                </div>
                            </div>
                            <div class="flex items-center gap-x-2">
                                <CircleDollarSign class='w-4 text-gray-500'/>
                                <TextS>₱{formatNumber(post.salary_min)} - ₱{formatNumber(post.salary_max)}</TextS>
                            </div>
                            <div class="flex items-center gap-x-2">
                                <MapPin class='w-4 text-gray-500'/>
                                <TextS>{post.address}</TextS>
                            </div>
                            <div class="flex items-center gap-x-2">
                                <Calendar class='w-4 text-gray-500'/>
                                <TextS>Open until: {formatDate(post.open_until)}</TextS>
                            </div>
                        </div>

                        <div class="flex flex-col items-stretch gap-y-2 border-t border-gray-100 pt-4 px-6">
                            <TextX class='text-gray-700/80 font-bold'>Description:</TextX>
                            <TextS class='text-justify'>{post.description}</TextS>
                        </div>

                        <div class="flex flex-col items-stretch gap-y-2 px-6">
                            <TextX class='text-gray-700/80 font-bold'>Qualifications:</TextX>
                            <div>
                                {#each post.qualifications as qualification}
                                    <div class="flex items-center gap-x-2">
                                        <CheckCircle class='w-4 text-gray-500'/>
                                        <TextS>{qualification.qualification}</TextS>
                                    </div>
                                {/each}
                            </div>
                        </div>

                        {#if post.additional_info}
                            <div class="flex flex-col items-stretch gap-y-2 px-6">
                                <TextX class='text-gray-700/80 font-bold'>Additional Information:</TextX>
                                <div>
                                    <TextS class='text-justify'>{post.additional_info}</TextS>
                                </div>
                            </div>
                        {/if}

                        <div class="border-t border-gray-100 px-6 py-2 flex justify-between gap-x-2">
                            <div class="flex items-center gap-x-2">
                                <div class="flex items-center gap-x-2">
                                    <ThumbsUp class='w-4 text-gray-500'/>
                                    <TextS>{
                                        post.likes >= 1000
                                            ? post.likes + 'k'
                                            : post.likes >= 1000000
                                                ? post.likes + 'm'
                                                : post.likes
                                    } {post.likes > 1 || post.likes === 0 ? 'Likes' : 'Like'}</TextS>
                                </div>
                                <div class="flex items-center gap-x-2">
                                    <Upload class='w-4 text-gray-500'/>
                                    <TextS>{
                                        post.submissions >= 1000
                                            ? post.submissions + 'k'
                                            : post.submissions >= 1000000
                                                ? post.submissions + 'm'
                                                : post.submissions
                                    } {post.submissions > 1 || post.submissions === 0 ? 'Submissions' : 'Submission'}</TextS>
                                </div>
                            </div>

                            <div class="flex items-center gap-x-2">
                                {#if post.is_liked}
                                    <button
                                        onclick={async () => await onDisike(post.id)}
                                        class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-red-100 text-red-500 hover:bg-red-50"
                                    >
                                        Dislike
                                    </button>
                                {:else}
                                    <button
                                        onclick={async () => await onLike(post.id)}
                                        class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-blue-100 text-blue-500 hover:bg-blue-50"
                                    >
                                        Like
                                    </button>
                                {/if}
                                {#if post.is_submitted}
                                    <button
                                        onclick={async () => await onUnsubmitCv(post.id)}
                                        class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-red-100 text-red-500 hover:bg-red-50"
                                    >
                                        Unsubmit CV
                                    </button>
                                {:else}
                                    <button
                                        onclick={async () => await onSubmitCv(post.id)}
                                        class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-green-100 text-green-500 hover:bg-green-50"
                                    >
                                        Submit CV
                                    </button>
                                {/if}
                            </div>
                        </div>
                    </RoundedCard>
                {/each}

                <!-- Sentinel element for IntersectionObserver -->
                <div bind:this={sentinelEl} class="py-4 flex justify-center">
                    {#if isFetching}
                        <TextS class='text-gray-400'>Loading more...</TextS>
                    {:else if !data.has_next && data.results.length > 0}
                        <TextS class='text-gray-400'>No more posts</TextS>
                    {/if}
                </div>
            </div>
        </div>
    {:else}
        <div class="grow min-h-0 relative col-span-8 border bg-white border-gray-200 rounded-lg overflow-auto scrollbar {openVercent ? 'flex items-stretch' : 'flex items-center justify-center'}">
            {#if openVercent}
                <VerificationPanel bind:openVercent={openVercent}/>
            {:else}
                <div class="flex flex-col items-center gap-y-2">
                    <img src="/error.gif" alt="error.gif" width="80">
                    <TextS class='text-center mb-2'>You cannot view job posts yet. <br> Your account needs to be verified by the Dean first.</TextS>
                    <ButtonM
                        label='Verification Center'
                        iconRight={true}
                        Icon={ChevronRight}
                        onclick={() => openVercent = true}
                    />
                </div>
            {/if}
        </div>
    {/if}
    
    <div class="grow min-h-0 relative col-span-4 pb-2">
        <div class="w-full flex flex-col items-stretch gap-4 overflow-auto h-full">
            <RoundedCard class='flex-1 space-y-2'>
                <TextS class='text-gray-500'>Employment History</TextS>
                <div class="max-h-[calc(40dvh)] scrollbar overflow-auto">
                    {#each $user.profile.occupations as occ}
                        <button
                            onclick={async () => {
                                selectedCareerId = occ.id;
                                await onGeocodeCareerAddress(occ);
                            }}
                            class={twMerge(
                                "flex items-center gap-x-3 rounded w-full cursor-pointer p-2",
                                selectedCareerId === occ.id && "bg-gray-100"
                            )}
                        >
                            <div class={twMerge(
                                "w-8 h-8 rounded flex items-center justify-center",
                                selectedCareerId === occ.id ? "bg-white/75" : "bg-gray-100"
                            )}>
                                <Briefcase class='w-4 text-gray-600'/>
                            </div>
                            <div class="grow flex flex-col items-start">
                                <TextS class='max-w-full truncate'>{occ.occupation.name}</TextS>
                                <TextX class='text-gray-500 max-w-full truncate'>{occ.start_year} - {!occ.end_year ? 'Present' : occ.end_year} at <span class="font-bold">{occ.company}</span></TextX>
                            </div>
                        </button>
                    {/each}
                </div>
            </RoundedCard>
            <RoundedCard class='flex-1 p-0 flex flex-col items-stretch'>
                {#if selectedCareerId}
                    <div class="p-2 border-b border-gray-200 flex items-center gap-x-2">
                        <MapPin class='w-4 text-gray-600'/>
                        <TextS>{$user.profile.occupations.find((o) => selectedCareerId === o.id).address}</TextS>
                    </div>
                    <div id="map" class="grow rounded-bl-lg rounded-br-lg flex items-center justify-center z-0">
                        {#if mapLoading}
                            <TextS>Map Loading...</TextS>
                        {:else}
                            {#if mapErrMsg}
                                <TextS>{mapErrMsg}</TextS>
                            {/if}
                        {/if}
                    </div>
                {/if}
            </RoundedCard>
        </div>
    </div>
</div>

<Modal
    bind:show={openSubmissions}
    heading={`CV Submissions (${submissions.length})`}
    class='md:w-2/5 h-full'
>
    {#each submissions as sub}
        <div class="flex items-center border border-gray-100 hover:bg-gray-100 transition-colors p-4 rounded">
            <div class="flex items-center gap-x-3 grow">
                <div 
                    style={`background-image: url(${apiUrl('/Uploads/company/logo/' + sub.post.company.logo)})`}
                    class="w-8 h-8 bg-cover bg-center rounded-full border border-gray-200"
                ></div>
                <div class="flex flex-col">
                    <TextM class='max-w-full truncate'>{sub.post.company.name} - Looking for {sub.post.position}</TextM>
                    <TextX>{formatDate(sub.post.created_at)}</TextX>
                </div>
            </div>
            <ButtonM
                Icon={Info}
                class='px-1 py-0'
                onclick={() => {
                    post = sub.post;
                    openPost = true;
                }}
            />
        </div>
    {/each}
</Modal>

<Modal
    bind:show={openLikes}
    heading={`Likes (${likes.length})`}
    class='md:w-2/5 h-full'
>
    {#each likes as like}
        <div class="flex items-center border border-gray-100 hover:bg-gray-100 transition-colors p-4 rounded">
            <div class="flex items-center gap-x-3 grow">
                <div 
                    style={`background-image: url(${apiUrl('/Uploads/company/logo/' + like.post.company.logo)})`}
                    class="w-8 h-8 bg-cover bg-center rounded-full border border-gray-200"
                ></div>
                <div class="flex flex-col">
                    <TextM class='max-w-full truncate'>{like.post.company.name} - Looking for {like.post.position}</TextM>
                    <TextX>{formatDate(like.post.created_at)}</TextX>
                </div>
            </div>
            <ButtonM
                Icon={Info}
                class='px-1 py-0'
                onclick={() => {
                    post = like.post;
                    openPost = true;
                }}
            />
        </div>
    {/each}
</Modal>

{#if openPost}
    <div class="fixed w-screen h-dvh bg-gray-300/50 p-8 inset-0 z-100 overflow-auto scrollbar">
        <RoundedCard class='flex flex-col items-stretch w-full md:w-2/3 gap-y-4 mx-auto p-0'>
            <div class="flex items-center justify-between border-b border-gray-100 p-4">
                <div class="flex items-center gap-x-3">
                    <div 
                        style={`background-image: url(${apiUrl('/Uploads/company/logo/' + post.company.logo)})`}
                        class="w-8 h-8 bg-cover bg-center rounded-full border border-gray-200"
                    ></div>
                    <div class="flex flex-col">
                        <TextM class='max-w-full truncate'>{post.company.name}</TextM>
                        <TextX>{formatDate(post.created_at)}</TextX>
                    </div>
                </div>

                <div class="flex items-center gap-x-2">
                    <ButtonM
                        Icon={X}
                        onclick={() => openPost = false}
                        class='bg-red-500 px-1 py-0'
                    />
                </div>
            </div>

            <div class="flex flex-col items-stretch gap-y-1 px-4">
                <TextS class='py-2 font-bold text-gray-700/80'>Looking for {post.position} ({post.slots} {post.slots > 1 ? 'slots' : 'slot'})</TextS>

                <div class="flex items-center gap-x-2">
                    <div class="flex items-center gap-x-2 bg-green-50 text-green-900 px-2 py-1 rounded">
                        <Scroll class='w-4'/>
                        <TextS>{post.work_employment_type}</TextS>
                    </div>
                    <div class="flex items-center gap-x-2 bg-yellow-50 text-yellow-900 px-2 py-1 rounded">
                        <SunMoon class='w-4'/>
                        <TextS>{post.work_shift}</TextS>
                    </div>
                    <div class="flex items-center gap-x-2 bg-blue-50 text-blue-900 px-2 py-1 rounded">
                        <Monitor class='w-4'/>
                        <TextS>{post.work_setup}</TextS>
                    </div>
                </div>
                
                <div class="flex items-center gap-x-3">
                    <CircleDollarSign class='w-4 text-gray-500'/>
                    <TextS>₱{formatNumber(post.salary_min)} - ₱{formatNumber(post.salary_max)}</TextS>
                </div>
                <div class="flex items-center gap-x-3">
                    <MapPin class='w-4 text-gray-500'/>
                    <TextS>{post.address}</TextS>
                </div>
                <div class="flex items-center gap-x-3">
                    <Calendar class='w-4 text-gray-500'/>
                    <TextS>Open until: {formatDate(post.open_until)}</TextS>
                </div>
            </div>

            <div class="flex flex-col items-stretch gap-y-2 border-t border-gray-100 pt-4 px-4">
                <TextX class='text-gray-700/80 font-bold'>Description:</TextX>
                <div>
                    <TextS class='text-justify'>{post.description}</TextS>
                </div>
            </div>

            <div class="flex flex-col items-stretch gap-y-2 px-4">
                <TextX class='text-gray-700/80 font-bold'>Qualifications:</TextX>
                <div>
                    {#each post.qualifications as qualification}
                        <div class="flex items-center gap-x-2">
                            <CheckCircle class='w-4 text-gray-500'/>
                            <TextS>{qualification.qualification}</TextS>
                        </div>
                    {/each}
                    </div>
            </div>

            {#if post.additional_info}
                <div class="flex flex-col items-stretch gap-y-2 px-4 pb-4">
                    <TextX class='text-gray-700/80 font-bold'>Additional Information:</TextX>
                    <div>
                        <TextS class='text-justify'>{post.additional_info}</TextS>
                    </div>
                </div>
            {/if}
        </RoundedCard>
    </div>
{/if}

<Modal
    bind:show={openProfile}
    heading='Alumni Profile'
    class='md:w-2/3 h-full'
>
    <div class="flex-1 min-h-0 space-y-2 overflow-y-hidden pt-0 bg-white flex flex-col items-stretch">
        <div class="w-full overflow-auto max-h-full scrollbar">
            <div class="flex flex-col overflow-clip">
                <div class="flex items-center justify-between p-4">
                    <div class="grow flex items-center gap-x-3">
                        <div 
                            style={`background-image: url(${apiUrl('/Uploads/alumni/profile_picture/' + $user.profile.profile_picture)})`}
                            class="w-10 h-10 bg-cover bg-center rounded-full border border-gray-200"
                        ></div>
                        <h1 class='text-xl max-w-7/10 truncate flex items gap-x-3'>{$user.profile.first_name}{$user.profile.name_extension && ' ' + $user.profile.name_extension}{$user.profile.middle_name && ' ' + $user.profile.middle_name} {$user.profile.last_name}</h1>
                    </div>
                </div>
                
                <div class="flex flex-col gap-y-2 p-4 border-t border-gray-100">
                    <TextS class='text-gray-700/75'>Employment Information</TextS>

                    <div class="grid grid-cols-3 gap-4">
                        <div class="flex flex-col items-stretch space-y-2">
                            <TextX class='font-bold text-gray-700/80'>Status</TextX>
                            {#if $user.profile.employment_status === 'Employed'}
                                <span class="w-fit inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">
                                    Employed
                                </span>
                            {:else if $user.profile.employment_status === 'Self-employed'}
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
                                    openCvModalUrl = $user.profile.cv;
                                    openCvModal = true;
									console.log(true);
                                }}
                                class="flex items-center gap-x-2 cursor-pointer"
                            >
                                <Link class='text-gray-600 w-4'/>
                                <TextS class='max-w-full truncate underline'>{$user.profile.cv}</TextS>
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex flex-col items-stretch space-y-2">
                        <div class="flex flex-col gap-y-2">
                            <TextX class='font-bold text-gray-700/80'>Employment History</TextX>
                            <div class="max-h-full grid md:grid-cols-3 gap-x-4">
                                {#each $user.profile.occupations as occ}
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
                    <TextS class='text-gray-700/75'>Personal Information</TextS>

                    <div class='grid grid-cols-3 gap-4'>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>First Name</TextX>
                            <TextS class='max-w-full truncate'>{$user.profile.first_name}{$user.profile.name_extension && ' ' + $user.profile.name_extension}</TextS>
                        </div>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>Middle Name</TextX>
                            <TextS class='max-w-full truncate'>{$user.profile.middle_name ? $user.profile.middle_name : 'N/A'}</TextS>
                        </div>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>Last Name</TextX>
                            <TextS class='max-w-full truncate'>{$user.profile.last_name}</TextS>
                        </div>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>Birth Date</TextX>
                            <TextS class='max-w-full truncate'>{formatDate($user.profile.birth_date)}</TextS>
                        </div>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>Birth Place</TextX>
                            <TextS class='max-w-full truncate'>{$user.profile.birth_place}</TextS>
                        </div>
                        <div class="flex flex-col items-stretch space-y-1">
                            <TextX class='font-bold text-gray-700/80'>Gender</TextX>
                            <TextS class='max-w-full truncate'>{$user.profile.gender}</TextS>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-y-2 p-4 border-t border-gray-100">
                    <TextS class='text-gray-700/75'>Contact Information</TextS>

                    <div class="space-y-4">
                        <div class='grid grid-cols-3 gap-4'>
                            <div class="flex flex-col items-stretch space-y-1">
                                <TextX class='font-bold text-gray-700/80'>Email Address</TextX>
                                <TextS class='max-w-full truncate'>{$user.profile.email}</TextS>
                            </div>
                            <div class="flex flex-col items-stretch space-y-1">
                                <TextX class='font-bold text-gray-700/80'>Phone Number</TextX>
                                <TextS class='max-w-full truncate'>{$user.profile.phone_number}</TextS>
                            </div>
                            <div class="flex flex-col items-stretch space-y-1">
                                <TextX class='font-bold text-gray-700/80'>Address</TextX>
                                <TextS class='max-w-full truncate'>{$user.profile.address}</TextS>
                            </div>
                            <div class="flex flex-col items-stretch space-y-1 col-span-3">
                                <TextX class='font-bold text-gray-700/80'>Social Media:</TextX>
                                <div class="flex flex-col gap-y-2">
                                    {#each $user.profile.social_medias as socmed}
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
                                <TextS class='max-w-full truncate'>{$user.profile.course.name}</TextS>
                            </div>
                            <div class="flex flex-col items-stretch space-y-1">
                                <TextX class='font-bold text-gray-700/80'>Student Number</TextX>
                                <TextS class='max-w-full truncate'>{$user.profile.student_number ? $user.profile.student_number : 'N/A'}</TextS>
                            </div>
                            <div class="flex flex-col items-stretch space-y-1">
                                <TextX class='font-bold text-gray-700/80'>Batch</TextX>
                                <TextS class='max-w-full truncate'>{$user.profile.graduation_year}</TextS>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
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