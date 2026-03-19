<template>
  <div class="params-panel">
    <ion-item button @click="expanded = !expanded" lines="none">
      <ion-label>参数配置</ion-label>
      <ion-icon :icon="expanded ? chevronUp : chevronDown" slot="end" />
    </ion-item>

    <div v-if="expanded" class="params-content">
      <!-- 宽高比选择 -->
      <ion-item>
        <ion-label>宽高比</ion-label>
        <ion-select v-model="localParams.aspect_ratio" interface="popover">
          <ion-select-option value="1:1">1:1 方形</ion-select-option>
          <ion-select-option value="16:9">16:9 横屏</ion-select-option>
          <ion-select-option value="9:16">9:16 竖屏</ion-select-option>
          <ion-select-option value="4:3">4:3</ion-select-option>
        </ion-select>
      </ion-item>

      <!-- 强制单图 -->
      <ion-item>
        <ion-label>强制单图输出</ion-label>
        <ion-toggle v-model="localParams.force_single" slot="end" />
      </ion-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { IonItem, IonLabel, IonSelect, IonSelectOption, IonToggle, IonIcon } from '@ionic/vue'
import { chevronDown, chevronUp } from 'ionicons/icons'
import type { ImageParams } from '../types/image'

const props = defineProps<{ modelValue: Partial<ImageParams> }>()
const emit = defineEmits<{ 'update:modelValue': [value: Partial<ImageParams>] }>()

const expanded = ref(false)
const localParams = ref<Partial<ImageParams>>({ aspect_ratio: '1:1', force_single: false, ...props.modelValue })

watch(localParams, (val) => emit('update:modelValue', val), { deep: true })
</script>
