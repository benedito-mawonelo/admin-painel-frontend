<template>
  <q-card class="stat-card" :style="{ borderLeft: `4px solid ${color}` }">
    <q-card-section>
      <div class="row items-center no-wrap">
        <div class="col">
          <div class="text-caption text-grey-5">{{ title }}</div>
          <div class="text-h5 text-weight-bold q-mt-sm q-mb-xs">{{ value }}</div>
          <div class="text-caption" :class="`text-${isPositive ? 'positive' : 'negative'}`">
            <q-icon :name="isPositive ? 'arrow_upward' : 'arrow_downward'" />
            {{ trend }} vs período anterior
          </div>
        </div>
        <div class="col-auto">
          <q-icon :name="icon" size="md" :color="color" />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
export default {
  props: {
    icon: String,
    title: String,
    value: [String, Number],
    trend: String,
    isPositive: Boolean,
    color: {
      type: String,
      default: 'primary'
    }
  }
}
</script>

<style lang="scss">
.stat-card {
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }

  .q-card__section {
    padding: 16px;
  }
}
</style>
