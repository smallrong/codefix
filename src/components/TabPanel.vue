<template>
  <div class="tabs">
    <div class="tabs-header">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="{ active: activeTab === tab.id }"
        @click="setActiveTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tabs-content">
      <div v-if="activeTab === 'errors'">
        <p>{{ errorLocation }}</p>
      </div>
      <div v-if="activeTab === 'knowledge'">
        <p>{{ relatedKnowledge }}</p>
      </div>
      <div v-if="activeTab === 'correct'" class="correct-code">
        <codeEdit 
          :code="correctCode"
          :language="'cpp'"
          :readonly="true"
          @update:code="(val) => correctCode = val"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import codeEdit from './codeEdit.vue';

// 定义props接收父组件传递的数据
const props = defineProps({
  errorLocation: {
    type: String,
    default: ''
  },
  correctCode: {
    type: String,
    default: ''
  },
  relatedKnowledge: {
    type: String,
    default: ''
  }
});

const activeTab = ref('errors');
const tabs = [
  { id: 'errors', label: '错在哪里' },
  { id: 'knowledge', label: '相关知识点' },
  { id: 'correct', label: '正确写法' }
];

const setActiveTab = (tabId) => {
  activeTab.value = tabId;
};
</script>

<style scoped>
.tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tabs-header {
  display: flex;
  background-color: #1E293B;
  border-bottom: 1px solid #374151;
}

.tabs-header button {
  flex: 1;
  padding: 12px;
  background-color: transparent;
  color: #CBD5E1;
  border: none;
  cursor: pointer;
  text-align: center;
  font-size: 14px;
}

.tabs-header button.active {
  background-color: #111827;
  color: #63b3ed;
  font-weight: bold;
}

.tabs-content {
  flex: 1;
  padding: 16px;
  background-color: #1E293B;
}

.tabs-content p {
  font-size: 14px;
  color: #CBD5E1;
}

.correct-code {
  height: 100%;
}
</style>