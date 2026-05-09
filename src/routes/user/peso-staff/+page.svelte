<script>
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { jsPDF } from 'jspdf';
  import { toPng } from 'html-to-image';
  import DashboardHeader from '$lib/components/user/DashboardHeader.svelte';
  import { get } from '$lib/utils/api';
  import { error } from '$lib/utils/ui';

  Chart.register(...registerables);

  let summaryCards = $state([
    { label: 'Total Companies', total: 0, sub: 'All entries',        color: 'text-blue-900' },
    { label: 'Active',          total: 0, sub: 'Currently enabled',  color: 'text-teal-600' },
    { label: 'Inactive',        total: 0, sub: 'Currently disabled', color: 'text-gray-400' },
  ]);

  const B = {
    900: '#042c53', 800: '#0c447c', 700: '#185fa5',
    500: '#378add', 300: '#85b7eb', 200: '#b5d4f4', 100: '#e6f1fb',
  };

  let companyIndustryStatus  = $state(null);
  let companyVerStatus       = $state(null);

  let companyDonutCanvas;
  let industryBarCanvas;

  let isExporting = $state(false);

  let companyDonutChart    = null;
  let companyIndustryChart = null;

  async function exportToPDF() {
    isExporting = true;
    const element = document.getElementById('dashboard-content');

    try {
      const dataUrl = await toPng(element, {
        height: element.scrollHeight,
        width: element.scrollWidth,
        style: { overflow: 'visible', maxHeight: 'none', height: 'auto' },
        cacheBust: true,
      });

      const pdf       = new jsPDF('p', 'mm', 'a4');
      const pdfWidth  = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps  = pdf.getImageProperties(dataUrl);
      const imgHeightInMm = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeightInMm;
      let position   = 0;

      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeightInMm);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeightInMm;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeightInMm);
        heightLeft -= pdfHeight;
      }

      pdf.save('Dashboard_Report.pdf');
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      isExporting = false;
    }
  }

  async function getSummaries() {
    await get('/api/stats/summaries', {
      onSuccess: async (data) => {
        summaryCards = summaryCards.map((card) => {
          if (card.label === 'Total Companies')
            return { ...card, total: data.company.total };
          else if (card.label === 'Active')
            return { ...card, total: data.company.active };
          else
            return { ...card, total: data.company.inactive };
        });
      },
      onFail: async (err) => error(err?.message ?? 'Unable to fetch summaries due to an error.')
    });
  }

  async function getCompanyIndustryAnalytics(active = null) {
    companyIndustryChart?.destroy();

    await get(`/api/stats/company/industry-analytics?active=${active}`, {
      onSuccess: async (data) => {
        companyIndustryChart = new Chart(industryBarCanvas, {
          type: 'bar',
          data: {
            labels: Object.keys(data),
            datasets: [{
              data: Object.values(data),
              backgroundColor: B[900],
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
      },
      onFail: async (err) => error(err?.message ?? 'Unable to fetch company industry analytics due to an error.')
    });
  }

  async function getCompanyVerificationAnalytics(active = null) {
    companyDonutChart?.destroy();

    await get(`/api/stats/company/ver-analytics?active=${active}`, {
      onSuccess: async (data) => {
        companyDonutChart = new Chart(companyDonutCanvas, {
          type: 'doughnut',
          data: {
            labels: ['Verified', 'Pending', 'Rejected'],
            datasets: [{
              data: [data.fully_verified, data.sysad_pending + data.pstaff_pending, data.sysad_rejected + data.pstaff_rejected],
              backgroundColor: [B[900], B[500], B[700]],
              borderWidth: 2,
              borderColor: 'transparent',
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: { legend: { display: false } },
          },
        });
      },
      onFail: async (err) => error(err?.message ?? 'Unable to fetch company verification analytics due to an error.')
    });
  }

  onMount(async () => {
    await Promise.all([
      getSummaries(),
      getCompanyIndustryAnalytics(),
      getCompanyVerificationAnalytics(),
    ]);
  });

  onDestroy(() => {
    companyIndustryChart?.destroy();
    companyDonutChart?.destroy();
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
        <select
          bind:value={companyIndustryStatus}
          onchange={async (e) => await getCompanyIndustryAnalytics(e.target.value)}
          class="py-1 rounded border border-gray-200 text-sm"
        >
          <option value={null}>Overall</option>
          <option value={true}>Active</option>
          <option value={false}>Inactive</option>
        </select>
      </div>
      <div class="relative h-112.5">
        <canvas bind:this={industryBarCanvas}></canvas>
      </div>
    </div>

    <div class="lg:col-span-2 space-y-4">
      <div class="bg-white border border-gray-200 rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xs font-medium uppercase tracking-widest text-gray-400">Verification Spread</h3>
          <select
            bind:value={companyVerStatus}
            onchange={async (e) => await getCompanyVerificationAnalytics(e.target.value)}
            class="py-1 rounded border border-gray-200 text-sm"
          >
            <option value={null}>Overall</option>
            <option value={true}>Active</option>
            <option value={false}>Inactive</option>
          </select>
        </div>
        <div class="flex gap-3 mb-3 text-xs text-gray-500">
          {#each [['Verified', B[900]], ['Pending', B[500]], ['Rejected', B[700]]] as [l, c]}
            <span class="flex items-center gap-1">
              <span class="inline-block w-2.5 h-2.5 rounded-sm" style="background:{c}"></span>{l}
            </span>
          {/each}
        </div>
        <div class="relative h-48">
          <canvas bind:this={companyDonutCanvas}></canvas>
        </div>
      </div>
    </div>
  </div>
</div>