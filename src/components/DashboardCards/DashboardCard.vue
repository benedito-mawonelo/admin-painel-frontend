<template>
  <q-card class="stat-card" :class="`bg-${color}-1`">
    <q-card-section>
      <div class="row items-center no-wrap">
        <div class="col">
          <div class="text-caption text-grey-7">{{ title }}</div>
          <div class="text-h5 q-mt-sm">{{ value }}</div>
        </div>
        <div class="col-auto">
          <q-icon :name="icon" size="lg" :color="color" />
        </div>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section class="q-py-sm">
      <div class="row items-center">
        <q-icon
          :name="trend >= 0 ? 'trending_up' : 'trending_down'"
          :color="trend >= 0 ? 'positive' : 'negative'"
          size="sm"
        />
        <span
          class="text-caption q-ml-xs"
          :class="trend >= 0 ? 'text-positive' : 'text-negative'"
        >
          {{ Math.abs(trend) }}% {{ trend >= 0 ? 'increase' : 'decrease' }}
        </span>
        <span class="text-caption text-grey q-ml-xs">vs last period</span>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: 'primary'
  },
  trend: {
    type: Number,
    default: 0
  }
})
</script>

<style lang="scss">
.stat-card {
  border-radius: 12px;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
  }
}
</style>
