<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

interface Props {
  series: { name: string; data: number[] }[]
  categories: string[]
  title?: string
  height?: number
  colors?: string[]
  horizontal?: boolean
  stacked?: boolean
  showDataLabels?: boolean
  formatter?: (val: number) => string
}

const props = withDefaults(defineProps<Props>(), {
  height: 350,
  colors: () => ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'],
  horizontal: false,
  stacked: false,
  showDataLabels: false,
  formatter: (val: number) => val.toLocaleString('pt-BR'),
})

const chartOptions = computed(() => ({
  chart: {
    type: 'bar' as const,
    toolbar: { show: false },
    fontFamily: 'Inter, sans-serif',
    stacked: props.stacked,
  },
  plotOptions: {
    bar: {
      horizontal: props.horizontal,
      borderRadius: 4,
      columnWidth: '60%',
      barHeight: '70%',
    },
  },
  dataLabels: {
    enabled: props.showDataLabels,
    formatter: props.formatter,
    style: { fontSize: '11px' },
  },
  colors: props.colors,
  xaxis: {
    categories: props.categories,
    labels: {
      style: { colors: '#64748b', fontSize: '12px' },
      formatter: props.horizontal ? props.formatter : undefined,
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      style: { colors: '#64748b', fontSize: '12px' },
      formatter: props.horizontal ? undefined : props.formatter,
    },
  },
  grid: {
    borderColor: '#e2e8f0',
    strokeDashArray: 4,
    xaxis: { lines: { show: props.horizontal } },
    yaxis: { lines: { show: !props.horizontal } },
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
      type="bar"
      :height="height"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>
