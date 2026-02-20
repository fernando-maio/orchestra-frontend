<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

interface Props {
  value: number
  label?: string
  title?: string
  height?: number
  color?: string
  maxValue?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 250,
  color: '#6366f1',
  maxValue: 100,
})

const percentage = computed(() => {
  return Math.min((props.value / props.maxValue) * 100, 100)
})

const chartOptions = computed(() => ({
  chart: {
    type: 'radialBar' as const,
    fontFamily: 'Inter, sans-serif',
  },
  plotOptions: {
    radialBar: {
      startAngle: -135,
      endAngle: 135,
      hollow: {
        size: '70%',
      },
      track: {
        background: '#e2e8f0',
        strokeWidth: '100%',
      },
      dataLabels: {
        name: {
          show: true,
          fontSize: '14px',
          color: '#64748b',
          offsetY: 60,
        },
        value: {
          show: true,
          fontSize: '32px',
          fontWeight: 600,
          color: '#1e293b',
          offsetY: -10,
          formatter: () => `${props.value}${props.maxValue === 100 ? '%' : ''}`,
        },
      },
    },
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'dark',
      type: 'horizontal',
      shadeIntensity: 0.5,
      gradientToColors: [props.color],
      inverseColors: false,
      opacityFrom: 1,
      opacityTo: 1,
      stops: [0, 100],
    },
  },
  stroke: { lineCap: 'round' as const },
  labels: [props.label || ''],
  colors: [props.color],
}))

const series = computed(() => [percentage.value])
</script>

<template>
  <div class="chart-container">
    <h3 v-if="title" class="text-lg font-semibold text-gray-900 mb-4 text-center">{{ title }}</h3>
    <VueApexCharts
      type="radialBar"
      :height="height"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>
