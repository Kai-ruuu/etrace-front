<script>
	import { twMerge } from "tailwind-merge";

    let {
        children,
        withBgImage = false,
        class: className = ''
    } = $props();
</script>

<div class={twMerge("w-screen h-dvh bg-gray-50 text-gray-800", withBgImage && "bg-[url(/bg.jpg)] bg-cover bg-center bg-no-repeat bg-fixed", className)}>
    {#if children}
        {@render children()}
    {/if}
</div>

<style>
    .animate-bg {
        animation: drift 60s ease-in-out infinite alternate;
        background-size: 150%;
    }

    @keyframes drift {
        0%   { background-position: 0% 0%; }
        25%  { background-position: 100% 0%; }
        50%  { background-position: 100% 100%; }
        75%  { background-position: 0% 100%; }
        100% { background-position: 0% 0%; }
    }
</style>