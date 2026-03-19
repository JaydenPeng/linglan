<template>
  <div class="video-player">
    <video
      ref="videoEl"
      :src="src"
      loop
      autoplay
      muted
      class="video-el"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onMetadata"
    />
    <div class="controls">
      <button class="play-btn" @click="togglePlay" type="button">
        {{ playing ? '⏸' : '▶' }}
      </button>
      <input
        type="range"
        class="progress"
        min="0"
        :max="duration"
        step="0.1"
        :value="currentTime"
        @input="seek($event)"
      />
      <span class="time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ src: string }>()

const videoEl = ref<HTMLVideoElement | null>(null)
const playing = ref(true)
const currentTime = ref(0)
const duration = ref(0)

function togglePlay() {
  if (!videoEl.value) return
  if (videoEl.value.paused) {
    videoEl.value.play()
    playing.value = true
  } else {
    videoEl.value.pause()
    playing.value = false
  }
}

function onTimeUpdate() {
  currentTime.value = videoEl.value?.currentTime ?? 0
}

function onMetadata() {
  duration.value = videoEl.value?.duration ?? 0
}

function seek(event: Event) {
  const val = Number((event.target as HTMLInputElement).value)
  if (videoEl.value) videoEl.value.currentTime = val
  currentTime.value = val
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.video-player {
  border-radius: 10px;
  overflow: hidden;
  background: #000;
  width: 100%;
}
.video-el {
  width: 100%;
  display: block;
  height: auto;
}
.controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #111;
}
.play-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
}
.progress {
  flex: 1;
  accent-color: #6c63ff;
  height: 4px;
}
.time {
  font-size: 11px;
  color: #888;
  white-space: nowrap;
}
</style>
