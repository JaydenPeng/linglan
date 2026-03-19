<template>
  <div class="settings-page">
    <h1>API 配置</h1>

    <!-- 即梦配置区块 (CONF-01) -->
    <section class="config-section">
      <h2>即梦 (Jimeng)</h2>
      <div class="status-badge" :class="{ configured: configStore.jimengConfigured }">
        {{ configStore.jimengConfigured ? '已配置' : '未配置' }}
      </div>
      <div class="input-group">
        <input v-model="jimengAk" type="password" placeholder="Access Key (AK)" />
        <input v-model="jimengSk" type="password" placeholder="Secret Key (SK)" />
      </div>
      <button @click="saveJimeng" :disabled="!jimengAk || !jimengSk">保存即梦密钥</button>
    </section>

    <!-- 可灵配置区块 (CONF-02) -->
    <section class="config-section">
      <h2>可灵 (Kling)</h2>
      <div class="status-badge" :class="{ configured: configStore.klingConfigured }">
        {{ configStore.klingConfigured ? '已配置' : '未配置' }}
      </div>
      <div class="input-group">
        <input v-model="klingAk" type="password" placeholder="Access Key (AK)" />
        <input v-model="klingSk" type="password" placeholder="Secret Key (SK)" />
      </div>
      <button @click="saveKling" :disabled="!klingAk || !klingSk">保存可灵密钥</button>
    </section>

    <p v-if="message" class="message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useConfigStore } from '../store/configStore'

const configStore = useConfigStore()
const jimengAk = ref('')
const jimengSk = ref('')
const klingAk = ref('')
const klingSk = ref('')
const message = ref('')

onMounted(() => configStore.refreshStatus())

async function saveJimeng() {
  const result = await window.electron.saveConfig({
    jimengAk: jimengAk.value,
    jimengSk: jimengSk.value
  })
  message.value = result.success ? '即梦密钥已保存' : `保存失败: ${result.error}`
  if (result.success) {
    jimengAk.value = ''
    jimengSk.value = ''
    await configStore.refreshStatus()
  }
}

async function saveKling() {
  const result = await window.electron.saveConfig({
    klingAk: klingAk.value,
    klingSk: klingSk.value
  })
  message.value = result.success ? '可灵密钥已保存' : `保存失败: ${result.error}`
  if (result.success) {
    klingAk.value = ''
    klingSk.value = ''
    await configStore.refreshStatus()
  }
}
</script>
