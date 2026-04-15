<script>
    import { goto } from "$app/navigation";
    import { twMerge } from "tailwind-merge";
    import TextS from "./TextS.svelte";
    import { page } from "$app/state";
	import { get } from "$lib/utils/api";
	import { error, success } from "$lib/utils/ui";
	import { LogOut } from "lucide-svelte";

    async function onLogout() {
        await get('/api/auth', {
            onSuccess: async (data) => {
                goto('/', { replaceState: true });
                success(data?.message ?? 'Logged out successfully!');
            },
            onFail: async (data) => {
                goto('/', { replaceState: true });
                error(data?.message ?? 'Unable to logout properly.');
            }
        });
    }
</script>

<button
    onclick={onLogout}
    class="flex items-center gap-x-2 cursor-pointer rounded p-2"
>
    <LogOut class='w-4'/>
    <TextS>Logout</TextS>
</button>