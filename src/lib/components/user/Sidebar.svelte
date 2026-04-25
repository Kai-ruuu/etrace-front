<script>
	import { BadgeCheck, Book, Briefcase, Building2, FileUser, GraduationCap, LayoutDashboard, List, LogOut, School, Settings, User, UserLock } from "lucide-svelte";
	import Logo from "../global/Logo.svelte";
	import TextM from "../global/TextM.svelte";
	import TextX from "../global/TextX.svelte";
	import { user } from "$lib/stores/user";
	import SidebarLink from "../global/SidebarLink.svelte";
	import SidebarGroup from "../global/SidebarGroup.svelte";
	import SidebarLogoutButton from "../global/SidebarLogoutButton.svelte";
</script>

<div class="md:min-w-1/4 border-r border-gray-200 bg-white">
    <div class="min-h-16 flex items-center bg-white px-4 gap-x-3">
        <div class="flex items-center justify-center min-w-8 min-h-8 bg-blue-50 border border-blue-100 rounded">
            <GraduationCap class='min-w-6 text-blue-900'/>
        </div>
        <div>
            <TextM class='font-bold text-blue-900'>E-trace+</TextM>
            <TextX class='text-gray-500'>Tracking Careers. Empowering Connections.</TextX>
        </div>
    </div>

    <div class="w-full p-4 flex flex-col gap-y-5">
        {#if $user.role === 'sysad'}
            <SidebarGroup label='Main Menu'>
                <SidebarLink Icon={LayoutDashboard} label='Dashboard' path='/user/system-admin'/>
            </SidebarGroup>
            <SidebarGroup label='Manage'>
                <SidebarLink Icon={School} label='Schools' path='/user/system-admin/manage-schools'/>
                {#if $user.default}
                    <SidebarLink Icon={User} label='System Administrators' path='/user/system-admin/manage-system-admins'/>
                {/if}
                <SidebarLink Icon={User} label='Deans' path='/user/system-admin/manage-deans'/>
                <SidebarLink Icon={User} label='PESO Staffs' path='/user/system-admin/manage-peso-staffs'/>
                <SidebarLink Icon={Building2} label='Companies' path='/user/system-admin/manage-companies'/>
            </SidebarGroup>
            <SidebarGroup label='Settings'>
                <SidebarLink Icon={Settings} label='Settings' path='/user/system-admin/settings'/>
                <SidebarLogoutButton />
            </SidebarGroup>
        {:else if $user.role === 'dean'}
            <SidebarGroup label='Main Menu'>
                <SidebarLink Icon={LayoutDashboard} label='Dashboard' path='/user/dean'/>
            </SidebarGroup>
            <SidebarGroup label='Manage'>
                <SidebarLink Icon={Book} label='Courses' path='/user/dean/manage-courses'/>
                <SidebarLink Icon={FileUser} label='Graduate Records' path='/user/dean/manage-records'/>
                <SidebarLink Icon={Briefcase} label='Occupations' path='/user/dean/manage-occupations'/>
                <SidebarLink Icon={User} label='Alumni' path='/user/dean/manage-alumni'/>
            </SidebarGroup>
            <SidebarGroup label='Settings'>
                <SidebarLink Icon={Settings} label='Settings' path='/user/dean/settings'/>
                <SidebarLogoutButton />
            </SidebarGroup>
        {:else if $user.role === 'pstaff'}
            <SidebarGroup label='Main Menu'>
                <SidebarLink Icon={LayoutDashboard} label='Dashboard' path='/user/peso-staff'/>
            </SidebarGroup>
            <SidebarGroup label='Manage'>
                <SidebarLink Icon={User} label='Companies' path='/user/peso-staff/manage-companies'/>
            </SidebarGroup>
            <SidebarGroup label='Settings'>
                <SidebarLink Icon={Settings} label='Settings' path='/user/peso-staff/settings'/>
                <SidebarLogoutButton />
            </SidebarGroup>
        {:else if $user.role === 'company'}
            <SidebarGroup label='Main Menu'>
                <SidebarLink Icon={Briefcase} label='Job Posts' path='/user/company'/>
                <SidebarLink Icon={BadgeCheck} label='Verification Center' path='/user/company/verification-center'/>
            </SidebarGroup>
            <SidebarGroup label='Settings'>
                <SidebarLink Icon={Settings} label='Settings' path='/user/company/settings'/>
                <SidebarLogoutButton />
            </SidebarGroup>
        {/if}
    </div>
</div>