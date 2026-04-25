<script>
  import { onMount, onDestroy, untrack } from 'svelte';
  import { Chart, registerables } from 'chart.js';
	import { jsPDF } from 'jspdf';
	import { toPng } from 'html-to-image';
	import TextM from '$lib/components/global/TextM.svelte';
	import DashboardHeader from '$lib/components/user/DashboardHeader.svelte';

  Chart.register(...registerables);

  // ─── Data ───────────────────────────────────────────────────
  const userSummary = [
    { label: 'Alumni',        total: 3480, active: 2941, secondary: 539, secondaryLabel: 'inactive' },
  ];

  const academicSummary = [
    { label: 'Schools',      total: 6,    active: 5,    secondary: 1,   secondaryLabel: 'archived' },
    { label: 'Courses',      total: 24,   active: 20,   secondary: 4,   secondaryLabel: 'archived' },
  ];

  const courses = [
    { code: 'BSCS',   name: 'BS Computer Science' },
    { code: 'BSIT',   name: 'BS Information Technology' },
    { code: 'BSE-E',  name: 'BSEd English' },
    { code: 'BSE-F',  name: 'BSEd Filipino' },
    { code: 'BSE-M',  name: 'BSEd Mathematics' },
    { code: 'BSE-Sc', name: 'BSEd Science' },
    { code: 'BSE-Ss', name: 'BSEd Social Studies' },
  ];

  const alumniPerCourse = [420, 510, 280, 190, 310, 260, 240];
  const alumniVerification = { verified: 2100, rejected: 380, pending: 1000 };

  // Employment logic
  const currentYear = new Date().getFullYear();
  const years = ['Overall', ...Array.from({ length: currentYear - 2007 + 1 }, (_, i) => String(2007 + i))];

  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  const batchData = {};
  years.forEach(y => {
    const total = y === 'Overall' ? 3480 : randInt(60, 220);
    const emp   = Math.round(total * (Math.random() * 0.2 + 0.45));
    const self  = Math.round(total * (Math.random() * 0.1 + 0.1));
    const dec   = Math.round(total * (Math.random() * 0.02 + 0.01));
    const unemp = Math.max(0, total - emp - self - dec);
    batchData[y] = { employed: emp, selfEmployed: self, unemployed: unemp, deceased: dec };
  });

  const alignedData = courses.map((_, i) => {
    const emp     = Math.round(alumniPerCourse[i] * (Math.random() * 0.15 + 0.4));
    const aligned = Math.round(emp * (Math.random() * 0.3 + 0.45));
    return { aligned, notAligned: emp - aligned };
  });

  // ─── Colors ──────────────────────────────────────────────────
  const B = { 900: '#042c53', 800: '#0c447c', 700: '#185fa5', 500: '#378add', 300: '#85b7eb' };
  const TEAL   = '#1D9E75';
  const RED    = '#E24B4A';
  const AMBER  = '#BA7517';

  // ─── State & Canvas ──────────────────────────────────────────
  let selectedYear = $state('Overall');
  let empChartInstance = null;
  let alumniStatusCanvas, courseChartCanvas, empChartCanvas, alignedChartCanvas;

  function makeBar(canvas, labels, datasets, options = {}) {
    return new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } }, stacked: options.xStacked || false },
          y: { ticks: { font: { size: 10 } }, stacked: options.yStacked || false },
        },
      },
    });
  }

  function buildEmpChart() {
    if (empChartInstance) empChartInstance.destroy();
    const d = batchData[selectedYear];
    empChartInstance = makeBar(empChartCanvas, 
      ['Employed', 'Self-employed', 'Unemployed', 'Deceased'],
      [{
        data: [d.employed, d.selfEmployed, d.unemployed, d.deceased],
        backgroundColor: [B[800], B[500], TEAL, '#888780'],
        borderRadius: 4,
      }]
    );
  }

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
    new Chart(alumniStatusCanvas, {
      type: 'pie',
      data: {
        labels: ['Verified', 'Rejected', 'Pending'],
        datasets: [{ data: Object.values(alumniVerification), backgroundColor: [TEAL, RED, AMBER], borderWidth: 0 }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    });

    makeBar(courseChartCanvas, courses.map(c => c.code), [{ data: alumniPerCourse, backgroundColor: B[700], borderRadius: 4 }]);
    buildEmpChart();
    makeBar(alignedChartCanvas, courses.map(c => c.code), [
      { label: 'Aligned', data: alignedData.map(d => d.aligned), backgroundColor: B[800], borderRadius: 4 },
      { label: 'Not aligned', data: alignedData.map(d => d.notAligned), backgroundColor: B[300], borderRadius: 4 },
    ], { xStacked: true, yStacked: true });
  });

  $effect(() => { if (empChartCanvas) untrack(() => buildEmpChart()); });
</script>

<DashboardHeader
    bind:exporting={isExporting}
    onExport={exportToPDF}
/>

<div id="dashboard-content" class="max-h-dvh overflow-auto scrollbar space-y-8 px-8 pb-10">
  
  <section class="mt-6">
    <h2 class="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Overview</h2>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {#each userSummary as u}
        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <p class="text-xs text-gray-500 mb-1">{u.label}</p>
          <p class="text-2xl font-medium text-blue-900">{u.total.toLocaleString()}</p>
          <p class="text-[11px] mt-1">
            <span class="text-teal-600 font-medium">● {u.active} active</span>
            <span class="text-gray-400 ml-2">● {u.secondary} {u.secondaryLabel}</span>
          </p>
        </div>
      {/each}
      {#each academicSummary as a}
        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <p class="text-xs text-gray-500 mb-1">{a.label}</p>
          <p class="text-2xl font-medium text-blue-900">{a.total.toLocaleString()}</p>
          <p class="text-[11px] mt-1">
            <span class="text-blue-600 font-medium">● {a.active} active</span>
            <span class="text-gray-400 ml-2">● {a.secondary} {a.secondaryLabel}</span>
          </p>
        </div>
      {/each}
    </div>
  </section>

  <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-white border border-gray-200 rounded-xl p-4">
      <p class="text-xs text-gray-400 mb-3">Alumni Verification Status</p>
      <div class="flex gap-3 mb-4 text-xs text-gray-500">
        {#each [['Verified',TEAL],['Rejected',RED],['Pending',AMBER]] as [l,c]}
          <span class="flex items-center gap-1">
            <span class="inline-block w-2.5 h-2.5 rounded-sm" style="background:{c}"></span> {l}
          </span>
        {/each}
      </div>
      <div class="relative h-48">
        <canvas bind:this={alumniStatusCanvas}></canvas>
      </div>
    </div>

    <div class="bg-white border border-gray-200 rounded-xl p-4">
      <p class="text-xs text-gray-400 mb-3">Alumni Count by Course</p>
      <div class="relative h-56">
        <canvas bind:this={courseChartCanvas}></canvas>
      </div>
    </div>
  </section>

  <section class="space-y-4">
    <div class="bg-white border border-gray-200 rounded-xl p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xs font-medium uppercase tracking-widest text-gray-400">Employment Status</h2>
        <select bind:value={selectedYear} class="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-500">
          {#each years as y}<option value={y}>{y === 'Overall' ? 'All Batches' : `Batch ${y}`}</option>{/each}
        </select>
      </div>
      <div class="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
        {#each [['Employed',B[800]],['Self-employed',B[500]],['Unemployed',TEAL],['Deceased','#888780']] as [l,c]}
          <span class="flex items-center gap-1">
            <span class="inline-block w-2.5 h-2.5 rounded-sm" style="background:{c}"></span> {l}
          </span>
        {/each}
      </div>
      <div class="relative h-60">
        <canvas bind:this={empChartCanvas}></canvas>
      </div>
    </div>

    <div class="bg-white border border-gray-200 rounded-xl p-4">
      <h2 class="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Course Alignment</h2>
      <div class="flex gap-3 mb-4 text-xs text-gray-500">
        {#each [['Aligned to Course',B[800]],['Not Aligned',B[300]]] as [l,c]}
          <span class="flex items-center gap-1">
            <span class="inline-block w-2.5 h-2.5 rounded-sm" style="background:{c}"></span> {l}
          </span>
        {/each}
      </div>
      <div class="relative h-52">
        <canvas bind:this={alignedChartCanvas}></canvas>
      </div>
    </div>
  </section>
</div>