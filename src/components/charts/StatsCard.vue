<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  trend?: number
  trendLabel?: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  loading: false,
})

const iconBgClass = computed(() => {
  const variants = {
    default: 'bg-gray-100 text-gray-600',
    primary: 'bg-indigo-100 text-indigo-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    danger: 'bg-red-100 text-red-600',
  }
  return variants[props.variant]
})

const trendClass = computed(() => {
  if (!props.trend) return 'text-gray-500'
  return props.trend > 0 ? 'text-green-600' : 'text-red-600'
})

const trendIcon = computed(() => {
  if (!props.trend) return ''
  return props.trend > 0 ? '↑' : '↓'
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-500 mb-1">{{ title }}</p>
        <div v-if="loading" class="animate-pulse">
          <div class="h-8 bg-gray-200 rounded w-24 mb-2"></div>
          <div class="h-4 bg-gray-100 rounded w-16"></div>
        </div>
        <template v-else>
          <p class="text-2xl font-bold text-gray-900">{{ value }}</p>
          <div class="flex items-center gap-2 mt-1">
            <span v-if="trend !== undefined" :class="['text-sm font-medium', trendClass]">
              {{ trendIcon }} {{ Math.abs(trend) }}%
            </span>
            <span v-if="subtitle || trendLabel" class="text-sm text-gray-500">
              {{ trendLabel || subtitle }}
            </span>
          </div>
        </template>
      </div>
      <div v-if="icon" :class="['p-3 rounded-lg', iconBgClass]">
        <span class="text-xl">{{ icon }}</span>
      </div>
    </div>
  </div>
</template>
