<template>
  <button
    type="button"
    :class="[
      `box-content relative inline-flex items-center min-w-[8rem] py-2 justify-center border border-transparent shadow-sm rounded-md text-white bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2`,
      classes,
      { 'bg-opacity-50': disabled },
    ]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script>
import { defineComponent } from 'vue'
export default defineComponent({
  props: {
    classes: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    click: null,
  },
})
</script>
