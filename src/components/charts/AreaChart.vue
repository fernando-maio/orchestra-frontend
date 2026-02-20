<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

interface Props {
  series: { name: string; data: number[] }[]
  categories: string[]
  title?: string
  height?: number
  colors?: string[]
  showToolbar?: boolean
  formatter?: (val: number) => string
}

const props = withDefaults(defineProps<Props>(), {
  height: 350,
  colors: () => ['#6366f1', '#8b5cf6', '#ec4899'],
  showToolbar: false,
  formatter: (val: number) => val.toLocaleString('pt-BR'),
})

const chartOptions = computed(() => ({
  chart: {
    type: 'area' as const,
    toolbar: { show: props.showToolbar },
    zoom: { enabled: false },
    fontFamily: 'Inter, sans-serif',
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth' as const, width: 2 },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.4,
      opacityTo: 0.1,
      stops: [0, 90, 100],
    },
  },
  colors: props.colors,
  xaxis: {
    categories: props.categories,
    labels: {
      style: { colors: '#64748b', fontSize: '12px' },
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      style: { colors: '#64748b', fontSize: '12px' },
      formatter: props.formatter,
    },
  },
  grid: {
    borderColor: '#e2e8f0',
    strokeDashArray: 4,
  },
  tooltip: {
    y: { formatter: props.formatter },
  },
  legend: {
    position: 'top' as const,
    horizontalAlign: 'right' as const,
  },
}))
</script>

<template>
  <div class="chart-container">
    <h3 v-if="title" class="text-lg font-semibold text-gray-900 mb-4">{{ title }}</h3>
    <VueApexCharts
      type="area"
      :height="height"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>
