import Swal from 'sweetalert2';
import ApexCharts from 'apexcharts';

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
});

export function success(message) {
    Toast.fire({ icon: 'success', title: message });
}

export function successAsync(message) {
    return Toast.fire({ icon: 'success', title: message });
}

export function error(message) {
    Toast.fire({ icon: 'error', title: message });
}

export function warning(message) {
    Toast.fire({ icon: 'warning', title: message });
}

export function info(message) {
    Toast.fire({ icon: 'info', title: message });
}

export function getRoleDisplay(user) {
    return {
        'sysad': 'System Administrator',
        'dean': 'Dean',
        'pstaff': 'PESO Staff',
        'company': 'Company',
        'alumni': 'Alumni',
    }[user.role];
}

export function formatNumber(number) {
    return new Intl.NumberFormat().format(number);
}

export function formatDate(dateObj) {
    const date = new Date(dateObj);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export function highlight(text, query) {
    if (!query.trim() || !query) {
        return text;
    }

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');

    return text.replace(regex, '<span class="font-bold text-blue-900">$1</span>');
}

export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function capitalizeWords(str) {
    return String(str).split(" ").map(capitalize).join(" ");
}

export function ChartDonut(element, labels, series, colors, { width = 80, height = 80 } = {}) {
    const options = {
        series,
        colors,
        chart: { type: 'donut', width, height,
            sparkline: { enabled: true },
        },
        labels,
        dataLabels: { enabled: false },
        stroke: { show: true, width: 1 },
        legend: { show: false }
    };
    
    let chart = new ApexCharts(element, options);
    chart.render();
    return chart;
}

export function ChartBarCurved(element, categories, series, colors, { width = '100%', height = '100%' } = {}) {
    const options = {
        series: series,
        colors,
        chart: {
            type: 'bar',
            width,
            height,
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                borderRadius: 2, 
                borderRadiusApplication: 'end',
            },
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        xaxis: { categories: categories },
        fill: { opacity: 1 },
        legend: { position: 'top', horizontalAlign: 'left' },
        tooltip: {
            y: { formatter: (val) => val + " alumni" }
        }
    };

    const chart = new ApexCharts(element, options);
    chart.render();
    return chart;
}

export function ChartAreaGradient(element, categories, series, colors, { width = '100%', height = '100%' } = {}) {
    const options = {
        series: series,
        colors: colors,
        chart: { type: 'area', width, height,
            toolbar: { show: false },
            zoom: { enabled: false }
        },
        stroke: { curve: 'smooth', width: 1 },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [20, 100]
            }
        },
        dataLabels: { enabled: false },
        xaxis: { categories: categories,
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: { labels: {
            formatter: (val) => val.toFixed(0)
        }},
        grid: { borderColor: '#f1f1f1', },
        legend: { position: 'top', horizontalAlign: 'left' },
        markers: { size: 4, hover: {
            size: 6
        }}
    };

    const chart = new ApexCharts(element, options);
    chart.render();
    return chart;
}