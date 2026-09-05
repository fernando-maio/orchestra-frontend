<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: number
  max?: number
  label?: string
  sublabel?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  showPercentage: true,
  size: 'md',
  variant: 'default',
})

// Percentual REAL, sem limite superior. É o que o usuário precisa ver quando
// o valor estoura o máximo.
const percentage = computed(() => {
  if (props.max <= 0) return 0
  return Math.max((props.value / props.max) * 100, 0)
})

// Largura da barra, essa sim limitada — senão a barra vazaria o container.
const barWidth = computed(() => Math.min(percentage.value, 100))

const isOver = computed(() => percentage.value > 100)

const overAmount = computed(() => Math.max(props.value - props.max, 0))

const heightClass = computed(() => {
  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }
  return sizes[props.size]
})

const colorClass = computed(() => {
  if (props.variant !== 'default') {
    const colors = {
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      danger: 'bg-red-500',
    }
    return colors[props.variant]
  }

  // Antes esta comparação usava o percentual já limitado a 100, então o ramo
  // vermelho era inalcançável. Agora usa o valor real.
  if (percentage.value > 100) return 'bg-red-500'
  if (percentage.value > 80) return 'bg-yellow-500'
  return 'bg-indigo-500'
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(val)
}
</script>

<template>
  <div class="progress-bar-container">
    <div v-if="label || showPercentage" class="flex justify-between items-center mb-1">
      <div>
        <span v-if="label" class="text-sm font-medium text-gray-700">{{ label }}</span>
        <span v-if="sublabel" class="text-xs text-gray-500 ml-2">{{ sublabel }}</span>
      </div>
      <div class="text-sm text-gray-600">
        <span
          v-if="showPercentage"
          class="font-medium"
          :class="isOver ? 'text-red-600' : ''"
        >{{ percentage.toFixed(0) }}%</span>
        <span class="text-xs text-gray-500 ml-1">({{ formatCurrency(value) }} / {{ formatCurrency(max) }})</span>
      </div>
    </div>
    <div :class="['w-full bg-gray-200 rounded-full overflow-hidden', heightClass]">
      <div
        :class="['transition-all duration-500 rounded-full', heightClass, colorClass]"
        :style="{ width: `${barWidth}%` }"
      />
    </div>

    <!-- A barra cheia sozinha não distingue "no limite" de "estourou".
         Este aviso diz o quanto passou, em dinheiro. -->
    <p v-if="isOver" class="mt-1 text-xs font-medium text-red-600">
      Estourou {{ formatCurrency(overAmount) }}
      ({{ (percentage - 100).toFixed(0) }}% acima do orçamento)
    </p>
  </div>
</template>
