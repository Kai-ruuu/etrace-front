<script>
    import { twMerge } from "tailwind-merge";
    import ButtonM from "$lib/components/global/ButtonM.svelte";
    import TextS from "$lib/components/global/TextS.svelte";
    import { ChevronLeft, ChevronRight } from "lucide-svelte";

    let {
        data = $bindable({
            results: null,
            total: 0,
            page: 1,
            per_page: 20,
            total_pages: 0,
            has_next: false,
            has_prev: false,
        }),
        onSearch,
        class: className = ''
    } = $props();

    const visiblePages = $derived.by(() => {
        const { page, total_pages } = data;
        if (total_pages <= 7) {
            return Array.from({ length: total_pages }, (_, i) => i + 1);
        }

        const pages = new Set([1, total_pages, page]);
        if (page > 1) pages.add(page - 1);
        if (page < total_pages) pages.add(page + 1);

        return [...pages].sort((a, b) => a - b).reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
        }, []);
    });

    const changePage = (page) => {
        data.page = page;
        onSearch();
    };
</script>

<div class={twMerge("flex items-center justify-between bg-white py-2", className)}>
    <TextS class="text-gray-600">
        {#if data.total > 0}
            Showing {(data.page - 1) * data.per_page + 1}-{Math.min(data.page * data.per_page, data.total)} of {data.total}
        {:else}
            No results
        {/if}
    </TextS>

    <div class="flex items-center gap-x-2">
        <ButtonM
            Icon={ChevronLeft}
            disabled={!data.has_prev}
            onclick={() => changePage(data.page - 1)}
            class={twMerge(
                "bg-transparent border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 cursor-pointer",
                !data.has_prev && "opacity-40 cursor-not-allowed pointer-events-none"
            )}
        />

        {#each visiblePages as p}
            {#if p === '...'}
                <span class="px-2 text-gray-400 text-sm select-none">…</span>
            {:else}
                <ButtonM
                    label={String(p)}
                    onclick={() => changePage(p)}
                    class={twMerge(
                        "min-w-8 px-0 border",
                        p === data.page
                            ? "bg-blue-950 border-blue-950 text-white px-4"
                            : "bg-transparent border-gray-200 text-gray-600 hover:bg-gray-50 px-4"
                    )}
                />
            {/if}
        {/each}

        <ButtonM
            Icon={ChevronRight}
            disabled={!data.has_next}
            onclick={() => changePage(data.page + 1)}
            class={twMerge(
                "bg-transparent border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 cursor-pointer",
                !data.has_next && "opacity-40 cursor-not-allowed pointer-events-none"
            )}
        />
    </div>
</div>