<script>
    import { onMount } from "svelte";
    import ButtonM from "../global/ButtonM.svelte";
    import TextM from "../global/TextM.svelte";
    import RoundedCard from "../global/RoundedCard.svelte";
    import TextS from "../global/TextS.svelte";
    import { X } from "lucide-svelte";
    import { geocode } from "$lib/utils/api";

    let {
        show = $bindable(false),
        address
    } = $props();

    let marker = $state(null);
    let map = $state(null);
    let mapErrMsg = $state("");
    let mapLoading = $state(false);

    async function onGeocodeCareerAddress() {
        mapLoading = true;
        mapErrMsg = "";

        try {
            const data = await geocode(address);

            if (typeof data === "string") {
                mapErrMsg = data;
                return;
            }

            const [latitude, longitude] = data;

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

    $effect(() => {
        if (show) {
            // tick() ensures #map is in the DOM before Leaflet touches it
            import('svelte').then(({ tick }) => tick().then(onGeocodeCareerAddress));
        }
    });
</script>

{#if show}
    <div class="fixed w-screen h-dvh bg-gray-300/50 p-8 inset-0 z-100 flex items-center justify-center">
        <RoundedCard class="flex flex-col items-stretch w-full md:w-2/3 gap-y-4 mx-auto h-full">
            <div class="flex items-center justify-between bg-white">
                <TextM>{address}</TextM>
                <ButtonM
                    Icon={X}
                    onclick={() => show = false}
                    class='p-0 px-1 bg-red-500'
                />
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
        </RoundedCard>
    </div>
{/if}