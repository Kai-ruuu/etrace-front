<script>
  import { onMount } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { jsPDF } from 'jspdf';
  import { toPng } from 'html-to-image';
  import TextM from '$lib/components/global/TextM.svelte';
  import DashboardHeader from '$lib/components/user/DashboardHeader.svelte';
  Chart.register(...registerables);

  // ─── Company Metrics ────────────────────────────────────────
  const summaryCards = [
    { label: 'Total Companies', total: 214, sub: 'All entries', color: 'text-blue-900' },
    { label: 'Active',          total: 178, sub: 'Currently Posting', color: 'text-teal-600' },
    { label: 'Inactive',        total: 36,  sub: 'No activity', color: 'text-gray-400' },
  ];

  const industries = [
    'Technology / IT', 'Finance / Banking / Insurance', 'Healthcare / Pharmaceuticals',
    'Education / Research', 'Manufacturing / Industrial', 'Retail / E-commerce',
    'Food & Beverage / Hospitality', 'Transportation / Logistics', 'Energy / Utilities',
    'Media / Entertainment / Advertising', 'Government / Public Sector',
    'Real Estate / Construction', 'Consulting / Professional Services', 'Nonprofit / NGO',
    'Telecommunications'
  ];

  // Distribution based on total
  const companiesPerIndustry = [35, 12, 8, 22, 18, 14, 25, 10, 5, 9, 15, 20, 11, 4, 6];

  // ─── Colors ──────────────────────────────────────────────────
  const B = { 900: '#042c53', 800: '#0c447c', 700: '#185fa5', 500: '#378add', 300: '#85b7eb' };
  const RED = '#E24B4A';
  const AMBER = '#BA7517';
  const TEAL = '#1D9E75';

  let companyDonutCanvas;
  let industryBarCanvas;

	let isExporting = $state(false);
  
	async function exportToPDF() {
		isExporting = true;
		const element = document.getElementById('dashboard-content');

		// 1. Get the actual full height of the scrollable content
		const originalStyle = element.style.cssText;
		
		try {
			// 2. Temporarily expand the element so all children are "visible"
			// We remove the height constraints just for the capture
			const dataUrl = await toPng(element, {
			height: element.scrollHeight,
			width: element.scrollWidth,
			style: {
				overflow: 'visible',
				maxHeight: 'none',
				height: 'auto'
			},
			// 3. Optional: Add a slight delay to ensure Chart.js animations are finished
			cacheBust: true,
			});

			const pdf = new jsPDF('p', 'mm', 'a4');
			const pdfWidth = pdf.internal.pageSize.getWidth();
			const pdfHeight = pdf.internal.pageSize.getHeight();
			
			// Calculate how many pages we need (if the dashboard is very long)
			const imgProps = pdf.getImageProperties(dataUrl);
			const imgHeightInMm = (imgProps.height * pdfWidth) / imgProps.width;
			
			let heightLeft = imgHeightInMm;
			let position = 0;

			// Add first page
			pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeightInMm);
			heightLeft -= pdfHeight;

			// 4. Handle Multi-page PDF if content is longer than one A4
			while (heightLeft > 0) {
			position = heightLeft - imgHeightInMm;
			pdf.addPage();
			pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeightInMm);
			heightLeft -= pdfHeight;
			}

			pdf.save(`Dashboard_Report.pdf`);
		} catch (error) {
			console.error('Export failed:', error);
		} finally {
			isExporting = false;
		}
		}

  onMount(() => {
    // Status Donut
    new Chart(companyDonutCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Verified', 'Pending', 'Rejected'],
        datasets: [{
          data: [89, 85, 40],
          backgroundColor: [TEAL, AMBER, RED],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: { legend: { display: false } },
      },
    });

    // Industry Bar
    new Chart(industryBarCanvas, {
      type: 'bar',
      data: {
        labels: industries,
        datasets: [{
          data: companiesPerIndustry,
          backgroundColor: B[700],
          borderRadius: 4,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { ticks: { font: { size: 9 }, autoSkip: false } },
        },
      },
    });
  });
</script>

<DashboardHeader
    bind:exporting={isExporting}
    onExport={exportToPDF}
/>

<div id="dashboard-content" class="max-h-dvh overflow-auto scrollbar space-y-8 px-8 pb-10">
  
  <section class="mt-6">
    <h2 class="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Company Summary</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      {#each summaryCards as card}
        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <p class="text-[10px] font-bold uppercase text-gray-400 mb-1">{card.label}</p>
          <p class="text-2xl font-medium {card.color}">{card.total}</p>
          <p class="text-[10px] text-gray-400 mt-1">{card.sub}</p>
        </div>
      {/each}
    </div>
  </section>

  <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
    <div class="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-5">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xs font-medium uppercase tracking-widest text-gray-400">Companies per Industry</h3>
        <span class="text-[10px] text-gray-400">Sorted by Volume</span>
      </div>
      <div class="relative h-[450px]">
        <canvas bind:this={industryBarCanvas}></canvas>
      </div>
    </div>

    <div class="lg:col-span-2 space-y-4">
      <div class="bg-white border border-gray-200 rounded-xl p-5">
        <h3 class="text-xs font-medium uppercase tracking-widest text-gray-400 mb-4">Verification Spread</h3>
        <div class="relative h-56">
          <canvas bind:this={companyDonutCanvas}></canvas>
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span class="text-2xl font-bold text-blue-900">214</span>
            <span class="text-[10px] text-gray-400 uppercase">Total Entries</span>
          </div>
        </div>
        <div class="mt-4 grid grid-cols-3 gap-2 text-center border-t border-gray-50 pt-4">
            <div>
                <p class="text-xs font-bold text-teal-600">89</p>
                <p class="text-[9px] text-gray-400 uppercase">Verified</p>
            </div>
            <div>
                <p class="text-xs font-bold text-amber-600">85</p>
                <p class="text-[9px] text-gray-400 uppercase">Pending</p>
            </div>
            <div>
                <p class="text-xs font-bold text-red-500">40</p>
                <p class="text-[9px] text-gray-400 uppercase">Rejected</p>
            </div>
        </div>
      </div>

    </div>
  </div>
</div>
