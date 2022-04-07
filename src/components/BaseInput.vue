<template>
  <div>
    <label for="email" class="block text-sm font-medium text-gray-700">
      {{ label }}
    </label>
    <div class="mt-1">
      <input
        id="email"
        type="text"
        :class="[
          inputClasses,
          `shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2`,
        ]"
        :placeholder="placeholder"
        :value="modelValue"
        :readonly="readonly"
        @input="$emit('update:modelValue', $event.target.value)"
        @keypress.enter="$emit('enter', $event.target.value)"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
export default defineComponent({
  props: {
    label: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
    modelValue: {
      type: String,
      default: '',
    },
    inputClasses: {
      type: String,
      default: '',
    },
    readonly: {
      type: String,
      default: '',
    },
  },
  emits: {
    'update:modelValue': null,
    enter: null,
  },
})
</script>
