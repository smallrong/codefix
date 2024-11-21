<template>
  <div class="code-editor" ref="editorRef"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import CodeMirror from 'codemirror';
import 'codemirror/mode/clike/clike';
import 'codemirror/theme/mbo.css';

const props = defineProps({
  readonly: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const editorRef = ref(null);
let editor;

onMounted(() => {
  editor = CodeMirror(editorRef.value, {
    lineNumbers: true,
    theme: 'mbo',
    tabSize: 2,
    value: props.modelValue || '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n',
    readOnly: props.readonly,
    cursorBlinkRate: props.readonly ? -1 : 530,
    lineWrapping: true // 启用自动换行
  });

  // 监听编辑器内容变化
  editor.on('change', (cm) => {
    emit('update:modelValue', cm.getValue());
  });
});

// 监听父组件传入的值变化
watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== editor.getValue()) {
    editor.setValue(newValue);
  }
});
</script>

<style scoped>
.code-editor {
  height: 100%;
  overflow: hidden;
}

:deep(.CodeMirror) {
  height: 100%;
  background-color: #1E293B;
  color: #CBD5E1;
}

/* 自定义滚动条样式 */
:deep(.CodeMirror-scroll) {
  overflow-y: auto !important;
}

:deep(.CodeMirror-scroll)::-webkit-scrollbar {
  width: 8px;
}

:deep(.CodeMirror-scroll)::-webkit-scrollbar-track {
  background: #1E293B;
}

:deep(.CodeMirror-scroll)::-webkit-scrollbar-thumb {
  background: #4B5563;
  border-radius: 4px;
}

:deep(.CodeMirror-scroll)::-webkit-scrollbar-thumb:hover {
  background: #6B7280;
}

:deep(.CodeMirror-hscrollbar),
:deep(.CodeMirror-vscrollbar) {
  display: none !important;
}
</style>