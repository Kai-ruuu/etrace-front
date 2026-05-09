<script>
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { jsPDF } from 'jspdf';
  import { toPng } from 'html-to-image';
  import DashboardHeader from '$lib/components/user/DashboardHeader.svelte';
	import { get } from '$lib/utils/api';
	import { user } from '$lib/stores/user';
	import { error } from '$lib/utils/ui';
  
  Chart.register(...registerables);

  let users = $state([
    { label: 'System Admins', total: 0,    active: 7,    inactive: 1   },
    { label: 'Deans',         total: 0,   active: 10,   inactive: 2   },
    { label: 'PESO Staffs',   total: 0,   active: 15,   inactive: 3   },
    { label: 'Companies',     total: 0,  active: 178,  inactive: 36  },
    { label: 'Alumni',        total: 0, active: 2941, inactive: 539 },
  ]);

  const currentYear = new Date().getFullYear();
  const years = [...Array.from({ length: currentYear - 2007 + 1 }, (_, i) => String(2007 + i))];

  const B = {
    900: '#042c53', 800: '#0c447c', 700: '#185fa5',
    500: '#378add', 300: '#85b7eb', 200: '#b5d4f4', 100: '#e6f1fb',
  };

  let companyStatus = $state(null);
  let companyIndustryStatus = $state(null);
  let alumniStatus = $state(null);
  let alumniCountStatus = $state(null);
  let alumniEmpAnalyticsStatus = $state(null);
  let selectedYearEmpAnalytics = $state(null);
  let alumniEmpAlignmentStatus = $state(null);
  let selectedYearEmpAlignment = $state(null);
  
  let industryBarCanvas;
  let companyPipelineCanvas;
  let alumniStatusCanvas;
  let courseChartCanvas;
  let empChartCanvas;
  let alignedChartCanvas;

  let isExporting = $state(false);

  let companyIndustryChart = null;
  let companyPipelineChart = null;
  let alumniPipelineChart = null;
  let alumniPerCourseGraph = null;
  let alumniEmpStatuesGraph = null;
  let alumniAlignedCourseGraph = null;

  function makeBar(canvas, labels, datasets, options = {}) {
    return new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } }, ...(options.xStacked ? { stacked: true } : {}) },
          y: { ticks: { font: { size: 10 } }, ...(options.yStacked ? { stacked: true } : {}), ...(options.total != null ? { max: options.total } : {}) },
        },
        ...options.extra,
      },
    });
  }

  async function exportToPDF() {
    isExporting = true;
    const element = document.getElementById('dashboard-content');
    
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

  function getBluePalette(count) {
    const shades = [B[900], B[800], B[700], B[500], B[300], B[200], B[100]];
    if (count <= shades.length) return shades.slice(0, count);

    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1);
      const r = Math.round(4   + t * (230 - 4));
      const g = Math.round(44  + t * (241 - 44));
      const b = Math.round(83  + t * (251 - 83));
      return `rgb(${r},${g},${b})`;
    });
  }

  async function getSummaries() {
    await get('/api/stats/summaries', {
      onSuccess: async (data) => {
        users = users.map((user) => {
          if (user.label === 'System Admins') 
            return { ...user, total: data.sysad.total, active: data.sysad.active, inactive: data.sysad.inactive };
          else if (user.label === 'Deans') 
            return { ...user, total: data.dean.total, active: data.dean.active, inactive: data.dean.inactive };
          else if (user.label === 'PESO Staffs') 
            return { ...user, total: data.pstaff.total, active: data.pstaff.active, inactive: data.pstaff.inactive };
          else if (user.label === 'Companies') 
            return { ...user, total: data.company.total, active: data.company.active, inactive: data.company.inactive };
          else
            return { ...user, total: data.alumni.total, active: data.alumni.active, inactive: data.alumni.inactive };
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
              y: { ticks: { font: { size: 10 }, autoSkip: false } },
            },
          },
        });
      },
      onFail: async (err) => error(err?.message ?? 'Unable to fetch company industry analytics due to an error.')
    });
  }

  async function getCompanyVerificaitonAnalytics(active = null) {
    companyPipelineChart?.destroy();
    
    await get(`/api/stats/company/ver-analytics?active=${active}`, {
      onSuccess: async (data) => {
        companyPipelineChart = makeBar(
          companyPipelineCanvas,
          ['Fully Verified', 'System Admin. Pending', 'PESO Staff Pending', 'System Admin. Rejected', 'PESO Staff Rejected'],
          [{
            data: [data.fully_verified, data.sysad_pending, data.pstaff_pending, data.sysad_rejected, data.pstaff_rejected],
            backgroundColor: [B[900], B[700], B[500], B[300], B[100]],
            borderRadius: 4,
            borderSkipped: false,
          }],
          {
            extra: {
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 30 } },
                y: { ticks: { font: { size: 10 } }, max: data.total },
              }
            },
          },
        );
      },
      onFail: async (err) => error(err?.message ?? 'Unable to fetch company verification analytics due to an error.')
    });
  }

  async function getAlumniVerificationAnalytics(active = null) {
    alumniPipelineChart?.destroy();
    
    await get(`/api/stats/alumni/ver-analytics?active=${active}`, {
      onSuccess: async (data) => {
        alumniPipelineChart = new Chart(alumniStatusCanvas, {
          type: 'doughnut',
          data: {
            labels: ['Verified', 'Rejected', 'Pending'],
            datasets: [{
              data: [data.verified, data.rejected, data.pending],
              backgroundColor: [B[900], B[700], B[500]],
              borderWidth: 2,
              borderColor: 'transparent'
            }],
          },
          options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false } } },
        });
      },
      onFail: async (err) => error(err?.message ?? 'Unable to fetch alumni verification analytics due to an error.')
    });
  }

  async function getAlumniCountByCourseAnalytics(active = null) {
    alumniPerCourseGraph?.destroy();
    
    await get(`/api/stats/alumni/count-by-course?active=${active}`, {
      onSuccess: async (data) => {
        alumniPerCourseGraph = makeBar(
          courseChartCanvas,
          data.courses.map(c => c.code),
          [{
            data: data.counts,
            backgroundColor: getBluePalette(data.counts.length),
            borderRadius: 4,
            borderSkipped: false,
          }],
        );
      },
      onFail: async (err) => error(err?.message ?? 'Unable to fetch alumni count by course analytics due to an error.')
    });
  }

  async function getAlumniEmploymentAnalytics(batch = null, active = alumniEmpAnalyticsStatus) {
    alumniEmpStatuesGraph?.destroy();

    await get(`/api/stats/alumni/emp-analytics?active=${active}&batch=${batch}`, {
      onSuccess: async (data) => {
        alumniEmpStatuesGraph = makeBar(
          empChartCanvas,
          ['Employed', 'Self-employed', 'Unemployed', 'Deceased'],
          [{
            data: [data.employed, data.self_employed, data.unemployed, data.deceased],
            backgroundColor: [B[900], B[700], B[500], B[300]],
            borderRadius: 4,
            borderSkipped: false,
          }],
        );
      },
      onFail: async (err) => error(err?.message ?? 'Unable to fetch summaries due to an error.')
    });
  }

  async function getAlumniAlignmentAnalytics(batch = null, active = alumniEmpAlignmentStatus) {
    alumniAlignedCourseGraph?.destroy();

    await get(`/api/stats/alumni/alg-analytics?active=${active}&batch=${batch}`, {
      onSuccess: async (data) => {
        const labels     = Object.keys(data?.aligned     ?? {});
        const aligned    = Object.values(data?.aligned    ?? {});
        const notAligned = Object.values(data?.not_aligned ?? {});

        alumniAlignedCourseGraph = new Chart(alignedChartCanvas, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Aligned',
                data: aligned,
                borderColor: B[900],
                backgroundColor: B[900] + '22',
                pointBackgroundColor: B[900],
                tension: 0.4,
                fill: true,
              },
              {
                label: 'Not Aligned',
                data: notAligned,
                borderColor: '#ef4444',
                backgroundColor: '#ef444422',
                pointBackgroundColor: '#ef4444',
                tension: 0.4,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 10 } } },
              y: { ticks: { font: { size: 10 } } },
            },
          },
        });
      },
      onFail: async (err) => error(err?.message ?? 'Unable to fetch alignment analytics due to an error.'),
    });
  }

  onMount(async () => {
    if (!$user.default)
      users = users.filter((user) => user.label !== 'System Admins');
    
    await Promise.all([
      getSummaries(),
      getCompanyIndustryAnalytics(),
      getCompanyVerificaitonAnalytics(),
      getAlumniVerificationAnalytics(),
      getAlumniCountByCourseAnalytics(),
      getAlumniEmploymentAnalytics(),
      getAlumniAlignmentAnalytics(),
    ]);
  });

  onDestroy(() => {
    companyPipelineChart?.destroy();
    alumniPipelineChart?.destroy();
    alumniPerCourseGraph?.destroy();
    alumniEmpStatuesGraph?.destroy();
    alumniAlignedCourseGraph?.destroy();
    companyIndustryChart?.destroy();
  });
</script>

<DashboardHeader
    bind:exporting={isExporting}
    onExport={exportToPDF}
/>

<div id="dashboard-content" class="max-h-dvh overflow-auto scrollbar space-y-8 px-8 pb-10">

  <!-- User Summary -->
  <section class="mt-6">
    <h2 class="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">User Summary</h2>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {#each users as u}
        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <p class="text-xs text-gray-500 mb-1">{u.label}</p>
          <p class="text-2xl font-medium text-blue-900">{u.total.toLocaleString()}</p>
          <p class="text-xs mt-1">
            <span class="text-teal-600">● {u.active} active</span>
            <span class="text-red-500 ml-2">● {u.inactive} inactive</span>
          </p>
        </div>
      {/each}
    </div>
  </section>

  <!-- Alumni Overview -->
  <section>
    <h2 class="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Alumni Analytics</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

      <!-- Alumni status pie -->
      <div class="bg-white dark:bg-white border border-gray-200 dark:border-gray-200 rounded-xl p-4">
        <div class="flex items-center justify-between">
          <p class="text-xs text-gray-400 mb-3">Verification Status</p>
          <select
            bind:value={alumniStatus}
            onchange={async (e) => await getAlumniVerificationAnalytics(e.target.value)}
            class="py-1 rounded border border-gray-200 text-sm"
          >
            <option value={null}>Overall</option>
            <option value={true}>Active</option>
            <option value={false}>Inactive</option>
          </select>
        </div>
        <div class="flex gap-3 mb-3 text-xs text-gray-500">
          {#each [['Verified',B[900]],['Rejected',B[700]],['Pending',B[500]]] as [l,c]}
            <span class="flex items-center gap-1">
              <span class="inline-block w-2.5 h-2.5 rounded-sm" style="background:{c}"></span>{l}
            </span>
          {/each}
        </div>
        <div class="relative h-48">
          <canvas bind:this={alumniStatusCanvas}></canvas>
        </div>
      </div>

      <!-- Course bar -->
      <div class="bg-white dark:bg-white border border-gray-200 dark:border-gray-200 rounded-xl p-4">
        <div class="flex items-center justify-between mb-4">
          <p class="text-xs text-gray-400 mb-3">Alumni By Course</p>
          <select
            bind:value={alumniCountStatus}
            onchange={async (e) => await getAlumniCountByCourseAnalytics(e.target.value)}
            class="py-1 rounded border border-gray-200 text-sm"
          >
            <option value={null}>Overall</option>
            <option value={true}>Active</option>
            <option value={false}>Inactive</option>
          </select>
        </div>
        <div class="relative h-64">
          <canvas bind:this={courseChartCanvas}></canvas>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Employment by batch -->
      <div class="bg-white dark:bg-white border border-gray-200 dark:border-gray-200 rounded-xl p-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-full flex items-center justify-between">
            <p class="text-xs text-gray-400">Employment Status</p>
            <div class="flex items-center gap-x-4">
              <select
                bind:value={alumniEmpAnalyticsStatus}
                onchange={async (e) => await getAlumniEmploymentAnalytics(selectedYearEmpAnalytics, e.target.value)}
                class="py-1 rounded border border-gray-200 text-sm"
              >
                <option value={null}>Overall</option>
                <option value={true}>Active</option>
                <option value={false}>Inactive</option>
              </select>
              <select
                bind:value={selectedYearEmpAnalytics}
                onchange={async (e) => await getAlumniEmploymentAnalytics(e.target.value, alumniEmpAnalyticsStatus)}
                class="py-1 rounded border border-gray-200 text-sm"
              >
                <option value={null}>All Batches</option>
                {#each years as y}
                  <option value={y}>{`Batch ${y}`}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 mb-3 text-xs text-gray-500">
          {#each [['Employed',B[900]],['Self-employed',B[700]],['Unemployed',B[500]],['Deceased',B[300]]] as [l,c]}
            <span class="flex items-center gap-1">
              <span class="inline-block w-2.5 h-2.5 rounded-sm" style="background:{c}"></span>{l}
            </span>
          {/each}
        </div>
        <div class="relative h-64">
          <canvas bind:this={empChartCanvas}></canvas>
        </div>
      </div>
  
      <!-- Course-aligned employment -->
      <div class="bg-white dark:bg-white border border-gray-200 dark:border-gray-200 rounded-xl p-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-full flex items-center justify-between">
            <p class="text-xs text-gray-400">Course Aligned Employment</p>
            <div class="flex items-center gap-x-4">
              <select
                bind:value={alumniEmpAlignmentStatus}
                onchange={async (e) => await getAlumniAlignmentAnalytics(selectedYearEmpAlignment, e.target.value)}
                class="py-1 rounded border border-gray-200 text-sm"
              >
                <option value={null}>Overall</option>
                <option value={true}>Active</option>
                <option value={false}>Inactive</option>
              </select>
              <select
                bind:value={selectedYearEmpAlignment}
                onchange={async (e) => await getAlumniAlignmentAnalytics(e.target.value, alumniEmpAlignmentStatus)}
                class="py-1 rounded border border-gray-200 text-sm"
              >
                <option value={null}>All Batches</option>
                {#each years as y}
                  <option value={y}>{`Batch ${y}`}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
        <div class="flex gap-3 mb-3 text-xs text-gray-500">
          {#each [['Aligned to course',B[900]],['Not aligned','#ef4444']] as [l,c]}
            <span class="flex items-center gap-1">
              <span class="inline-block w-2.5 h-2.5 rounded-sm" style="background:{c}"></span>{l}
            </span>
          {/each}
        </div>
        <div class="relative h-64">
          <canvas bind:this={alignedChartCanvas}></canvas>
        </div>
      </div>
    </div>
  </section>

  <!-- Company Verification -->
  <section>
    <h2 class="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Company Analytics</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white border border-gray-200 rounded-xl p-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xs text-gray-400">Companies Per Industry</h3>
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
        <div class="relative h-64">
          <canvas bind:this={industryBarCanvas}></canvas>
        </div>
      </div>
    
      <div class="bg-white dark:bg-white border border-gray-200 dark:border-gray-200 rounded-xl p-4">
        <div class="flex items-center justify-between">
          <p class="text-xs text-gray-400 mb-3">Verification Status</p>
          <select
            bind:value={companyStatus}
            onchange={async (e) => await getCompanyVerificaitonAnalytics(e.target.value)}
            class="py-1 rounded border border-gray-200 text-sm"
          >
            <option value={null}>Overall</option>
            <option value={true}>Active</option>
            <option value={false}>Inactive</option>
          </select>
        </div>
        <div class="flex flex-wrap gap-2 mb-3 text-xs text-gray-500">
          {#each [
            { label: 'Fully Verified',      color: B[900] },
            { label: 'System Admin. Pending', color: B[700] },
            { label: 'PESO Staff Pending',  color: B[500] },
            { label: 'System Admin. Rejected', color: B[300] },
            { label: 'PESO Staff Rejected',  color: B[100] },
          ] as l}
            <span class="flex items-center gap-1">
              <span class="inline-block w-2.5 h-2.5 rounded-sm" style="background:{l.color}"></span>
              {l.label}
            </span>
          {/each}
        </div>
        <div class="relative h-52">
          <canvas bind:this={companyPipelineCanvas}></canvas>
        </div>
      </div>
    </div>
  </section>
</div>