<template>
  <div class="code-editor">
    <!-- 代码编辑器容器 -->
     
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import ace from 'ace-builds'
import 'ace-builds/src-noconflict/mode-javascript'
import 'ace-builds/src-noconflict/mode-python'
import 'ace-builds/src-noconflict/mode-java'
import 'ace-builds/src-noconflict/mode-c_cpp'
import 'ace-builds/src-noconflict/theme-monokai' // 使用 monokai 主题，这是一个流行的暗色调主题

// 定义组件接收的属性
const props = defineProps<{
  // 代码内容
  code: string,
  // 编程语言
  language: string,
  // 是否只读
  readonly?: boolean
}>()

// 定义事件
const emit = defineEmits<{
  (e: 'update:code', value: string): void
}>()

// 编辑器容器引用
const editorContainer = ref<HTMLElement>()
// 编辑器实例
let editor: ace.Ace.Editor
// 当前字体大小
let currentFontSize = 14

// 语言模式映射
const languageMap: Record<string, string> = {
  'javascript': 'javascript',
  'python': 'python',
  'java': 'java',
  'c': 'c_cpp',
  'cpp': 'c_cpp'
}

// 监听 Ctrl + 滚轮事件来调整字体大小
const handleWheel = (event: WheelEvent) => {
  if (event.ctrlKey) {
    event.preventDefault(); // 阻止默认滚轮行为
    if (event.deltaY < 0) {
      currentFontSize += 1; // 放大字体
    } else {
      currentFontSize -= 1; // 缩小字体
      if (currentFontSize < 12) currentFontSize = 12; // 限制最小字体大小
    }
    editor.setFontSize(currentFontSize);
  }
};

// 组件挂载时初始化编辑器
onMounted(() => {
  if (editorContainer.value) {
    // 创建编辑器实例
    editor = ace.edit(editorContainer.value)
    
    // 设置编辑器基本配置
    editor.setTheme('ace/theme/monokai') // 使用 monokai 暗色主题
    editor.session.setMode(`ace/mode/${languageMap[props.language] || 'text'}`)
    editor.setReadOnly(props.readonly || false)
    editor.setShowPrintMargin(false)
    editor.setFontSize(currentFontSize)
    
    // 设置初始代码
    editor.setValue(props.code || '', -1)
    
    // 监听代码变化
    editor.on('change', () => {
      emit('update:code', editor.getValue())
    })

    // 添加滚轮事件监听
    editorContainer.value.addEventListener('wheel', handleWheel, { passive: false })
  }
})

// 监听属性变化
watch(() => props.code, (newCode) => {
  if (editor && newCode !== editor.getValue()) {
    editor.setValue(newCode, -1)
  }
})

watch(() => props.language, (newLang) => {
  if (editor) {
    editor.session.setMode(`ace/mode/${languageMap[newLang] || 'text'}`)
  }
})

watch(() => props.readonly, (newReadonly) => {
  if (editor) {
    editor.setReadOnly(newReadonly || false)
  }
})
</script>

<style scoped>
.code-editor {
  width: 100%;
  height: 100%;
  position: relative;
}

.editor-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px solid #374151;
  border-radius: 8px;
  background-color: #1E293B;
}
</style>
