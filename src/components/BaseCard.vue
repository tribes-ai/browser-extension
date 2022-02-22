<template>
  <div :class="[classes, `bg-white overflow-hidden shadow rounded-lg`]">
    <div class="px-4 py-5 sm:p-6">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    classes: {
      type: String,
      default: '',
    },
  },
}
</script>
