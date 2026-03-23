<template>
  <!-- 底部半屏面板遮罩 -->
  <div v-if="isOpen" class="panel-overlay" @click.self="emit('close')">
    <div class="panel-sheet">
      <!-- 拖拽把手 -->
      <div class="drag-handle" />

      <!-- 顶部 Tab -->
      <div class="panel-tabs">
        <button
          :class="['panel-tab', { active: activeTab === 'library' }]"
          type="button"
          @click="activeTab = 'library'"
        >模板库</button>
        <button
          :class="['panel-tab', { active: activeTab === 'mine' }]"
          type="button"
          @click="activeTab = 'mine'"
        >我的模板</button>
      </div>

      <!-- 模板库 Tab -->
      <div v-if="activeTab === 'library'" class="tab-content">
        <!-- 分类标签横向滚动 -->
        <div class="category-scroll">
          <button
            v-for="cat in categories"
            :key="cat"
            :class="['cat-chip', { active: selectedCategory === cat }]"
            type="button"
            @click="selectedCategory = cat"
          >{{ cat }}</button>
        </div>

        <!-- 模板卡片列表 -->
        <div class="template-list">
          <div
            v-for="tpl in categoryTemplates"
            :key="tpl.id"
            class="template-card"
            @click="onSelect(tpl.content)"
          >
            <p class="tpl-title">{{ tpl.title }}</p>
            <p class="tpl-content">{{ tpl.content }}</p>
          </div>
          <div v-if="categoryTemplates.length === 0" class="empty-hint">该分类暂无模板</div>
        </div>
      </div>

      <!-- 我的模板 Tab -->
      <div v-if="activeTab === 'mine'" class="tab-content">
        <div class="template-list">
          <div
            v-for="tpl in customTemplates"
            :key="tpl.id"
            class="template-card mine-card"
          >
            <div class="mine-card-body" @click="onSelect(tpl.content)">
              <p class="tpl-title">{{ tpl.title }}</p>
              <p class="tpl-content">{{ tpl.content }}</p>
            </div>
            <button class="del-btn" type="button" @click="confirmDelete(tpl.id)">删除</button>
          </div>
          <div v-if="customTemplates.length === 0" class="empty-hint">暂无自定义模板</div>
        </div>

        <!-- 新增模板表单 -->
        <div v-if="!showAddForm" class="add-btn-wrap">
          <button class="add-btn" type="button" @click="showAddForm = true">+ 新增模板</button>
        </div>
        <div v-else class="add-form">
          <input v-model="newTitle" class="form-input" placeholder="模板标题" />
          <textarea v-model="newContent" class="form-textarea" placeholder="模板内容" rows="3" />
          <select v-model="newCategory" class="form-select">
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="resetForm">取消</button>
            <button type="button" class="save-btn" :disabled="!newTitle.trim() || !newContent.trim()" @click="onSave">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 删除确认弹窗 -->
  <div v-if="deleteTargetId" class="confirm-overlay" @click.self="deleteTargetId = null">
    <div class="confirm-dialog">
      <p>确认删除该模板？</p>
      <div class="confirm-btns">
        <button type="button" @click="deleteTargetId = null">取消</button>
        <button type="button" class="danger" @click="onDeleteConfirmed">删除</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePromptTemplateStore } from '../store/promptTemplateStore'
import type { PromptCategory } from '@shared/types/promptTemplate.ts'

defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', content: string): void
}>()

const templateStore = usePromptTemplateStore()

const activeTab = ref<'library' | 'mine'>('library')
const categories: PromptCategory[] = ['风景', '人物', '动漫', '建筑', '抽象', '自定义']
const selectedCategory = ref<PromptCategory>('风景')

const categoryTemplates = computed(() => templateStore.getByCategory(selectedCategory.value))
const customTemplates = computed(() => templateStore.customTemplates)

// 新增表单
const showAddForm = ref(false)
const newTitle = ref('')
const newContent = ref('')
const newCategory = ref<PromptCategory>('自定义')

// 删除确认
const deleteTargetId = ref<string | null>(null)

function onSelect(content: string) {
  emit('select', content)
  emit('close')
}

function confirmDelete(id: string) {
  deleteTargetId.value = id
}

function onDeleteConfirmed() {
  if (deleteTargetId.value) {
    templateStore.deleteCustomTemplate(deleteTargetId.value)
    deleteTargetId.value = null
  }
}

function onSave() {
  if (!newTitle.value.trim() || !newContent.value.trim()) return
  templateStore.addCustomTemplate(newTitle.value.trim(), newContent.value.trim(), newCategory.value)
  resetForm()
}

function resetForm() {
  showAddForm.value = false
  newTitle.value = ''
  newContent.value = ''
  newCategory.value = '自定义'
}
</script>

<style scoped>
.panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}
.panel-sheet {
  width: 100%;
  max-height: 60vh;
  background: #1a1a1a;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.drag-handle {
  width: 36px;
  height: 4px;
  background: #444;
  border-radius: 2px;
  margin: 10px auto 6px;
  flex-shrink: 0;
}
.panel-tabs {
  display: flex;
  border-bottom: 1px solid #2a2a2a;
  flex-shrink: 0;
}
.panel-tab {
  flex: 1;
  padding: 10px;
  background: none;
  border: none;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}
.panel-tab.active { color: #6c63ff; border-bottom-color: #6c63ff; }
.tab-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.category-scroll {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  overflow-x: auto;
  flex-shrink: 0;
}
.category-scroll::-webkit-scrollbar { display: none; }
.cat-chip {
  padding: 4px 14px;
  border-radius: 16px;
  border: 1px solid #333;
  background: none;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.cat-chip.active { background: #6c63ff; border-color: #6c63ff; color: #fff; }
.template-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.template-card {
  background: #222;
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.template-card:hover { background: #2a2a2a; }
.mine-card {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: default;
}
.mine-card-body { flex: 1; cursor: pointer; }
.tpl-title { font-size: 13px; font-weight: 600; color: #ddd; margin: 0 0 4px; }
.tpl-content {
  font-size: 12px;
  color: #777;
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.del-btn {
  flex-shrink: 0;
  background: none;
  border: 1px solid #c0392b;
  color: #c0392b;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
  cursor: pointer;
}
.empty-hint { text-align: center; color: #555; font-size: 13px; padding: 20px 0; }
.add-btn-wrap { padding: 8px 12px 12px; flex-shrink: 0; }
.add-btn {
  width: 100%;
  padding: 10px;
  background: none;
  border: 1px dashed #444;
  border-radius: 10px;
  color: #888;
  font-size: 13px;
  cursor: pointer;
}
.add-btn:hover { border-color: #6c63ff; color: #a89fff; }
.add-form {
  padding: 8px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}
.form-input, .form-textarea, .form-select {
  background: #111;
  border: 1px solid #333;
  border-radius: 8px;
  color: #eee;
  padding: 8px 10px;
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
}
.form-input:focus, .form-textarea:focus, .form-select:focus { outline: none; border-color: #6c63ff; }
.form-textarea { resize: vertical; }
.form-select option { background: #1a1a1a; }
.form-actions { display: flex; gap: 8px; justify-content: flex-end; }
.cancel-btn {
  padding: 7px 16px;
  background: none;
  border: 1px solid #444;
  border-radius: 8px;
  color: #888;
  font-size: 13px;
  cursor: pointer;
}
.save-btn {
  padding: 7px 16px;
  background: #6c63ff;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}
.save-btn:disabled { background: #3a3a5a; color: #666; cursor: not-allowed; }
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}
.confirm-dialog {
  background: #222;
  border-radius: 12px;
  padding: 20px 24px;
  min-width: 240px;
  text-align: center;
}
.confirm-dialog p { font-size: 14px; color: #ddd; margin: 0 0 16px; }
.confirm-btns { display: flex; gap: 10px; justify-content: center; }
.confirm-btns button {
  padding: 7px 20px;
  border-radius: 8px;
  border: 1px solid #444;
  background: none;
  color: #aaa;
  font-size: 13px;
  cursor: pointer;
}
.confirm-btns button.danger { background: #c0392b; border-color: #c0392b; color: #fff; }
</style>
