<script setup lang="ts">
import { computed } from 'vue'
import {
  Bolt,
  BrushCleaning,
  Building2,
  Camera,
  Gift,
  Lightbulb,
  Music,
  Package,
  Palette,
  Shield,
  Sofa,
  Truck,
  Tv,
  Users,
  Utensils,
  Wifi,
} from 'lucide-vue-next'
import type { Component } from 'vue'

/**
 * Os seeders gravam nomes no estilo Font Awesome (`utensils`, `couch`, `broom`),
 * que nem sempre coincidem com os do Lucide. Este mapa faz a ponte, para nao
 * precisar migrar os dados existentes.
 *
 * Nome desconhecido cai no `Package`, em vez de sumir da tela.
 */
const ICONS: Record<string, Component> = {
  utensils: Utensils,
  lightbulb: Lightbulb,
  building: Building2,
  tv: Tv,
  palette: Palette,
  couch: Sofa,
  bolt: Bolt,
  shield: Shield,
  broom: BrushCleaning,
  truck: Truck,
  wifi: Wifi,
  camera: Camera,
  users: Users,
  music: Music,
  gift: Gift,
}

const props = withDefaults(
  defineProps<{
    name?: string | null
    size?: number
  }>(),
  { name: null, size: 20 },
)

const component = computed<Component>(() => {
  if (!props.name) return Package
  return ICONS[props.name.toLowerCase()] ?? Package
})
</script>

<template>
  <component :is="component" :size="size" aria-hidden="true" />
</template>
