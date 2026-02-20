<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

interface SeriesItem {
  name: string
  type: 'column' | 'line'
  data: number[]
}

interface Props {
  series: SeriesItem[]
  categories: string[]
  title?: string
  height?: number
  colors?: string[]
  formatter?: (val: number) => string
}

const props = withDefaults(defineProps<Props>(), {
  height: 350,
  colors: () => ['#10b981', '#ef4444', '#6366f1'],
  formatter: (val: number) => val.toLocaleString('pt-BR'),
})

const chartOptions = computed(() => ({
  chart: {
    type: 'line' as const,
    toolbar: { show: false },
    fontFamily: 'Inter, sans-serif',
  },
  stroke: {
    width: [0, 0, 3],
    curve: 'smooth' as const,
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: '50%',
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
    shared: true,
    intersect: false,
    y: { formatter: props.formatter },
  },
  legend: {
    position: 'top' as const,
    horizontalAlign: 'right' as const,
  },
  dataLabels: { enabled: false },
}))
</script>

<template>
  <div class="chart-container">
    <h3 v-if="title" class="text-lg font-semibold text-gray-900 mb-4">{{ title }}</h3>
    <VueApexCharts
      type="line"
      :height="height"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>
