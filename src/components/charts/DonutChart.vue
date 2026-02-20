<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

interface Props {
  series: number[]
  labels: string[]
  title?: string
  height?: number
  colors?: string[]
  showLegend?: boolean
  centerLabel?: string
  centerValue?: string
  formatter?: (val: number) => string
}

const props = withDefaults(defineProps<Props>(), {
  height: 350,
  colors: () => ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
  showLegend: true,
  formatter: (val: number) => `${val.toFixed(1)}%`,
})

const chartOptions = computed(() => ({
  chart: {
    type: 'donut' as const,
    fontFamily: 'Inter, sans-serif',
  },
  labels: props.labels,
  colors: props.colors,
  legend: {
    show: props.showLegend,
    position: 'bottom' as const,
    fontSize: '13px',
  },
  dataLabels: {
    enabled: true,
    formatter: props.formatter,
    style: { fontSize: '12px' },
  },
  plotOptions: {
    pie: {
      donut: {
        size: '70%',
        labels: {
          show: !!props.centerValue,
          name: {
            show: true,
            fontSize: '14px',
            color: '#64748b',
          },
          value: {
            show: true,
            fontSize: '24px',
            fontWeight: 600,
            color: '#1e293b',
          },
          total: {
            show: !!props.centerValue,
            label: props.centerLabel || 'Total',
            formatter: () => props.centerValue || '',
          },
        },
      },
    },
  },
  tooltip: {
    y: {
      formatter: (val: number) => val.toLocaleString('pt-BR'),
    },
  },
  stroke: { width: 0 },
}))
</script>

<template>
  <div class="chart-container">
    <h3 v-if="title" class="text-lg font-semibold text-gray-900 mb-4">{{ title }}</h3>
    <VueApexCharts
      type="donut"
      :height="height"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>
