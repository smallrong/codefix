<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import QRCodeStyling from 'qr-code-styling'

const props = defineProps<{
  value: string
  size?: number
  margin?: number
}>()

const qrCode = ref<any>(null)
const container = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!container.value) return
  
  qrCode.value = new QRCodeStyling({
    width: props.size || 240,
    height: props.size || 240,
    data: props.value,
    margin: props.margin || 0,
    qrOptions: { typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'Q' },
    imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 },
    dotsOptions: { type: 'square', color: '#000000' },
    backgroundOptions: { color: '#ffffff' },
    cornersSquareOptions: { type: 'square', color: '#000000' },
    cornersDotOptions: { type: 'square', color: '#000000' },
  })

  qrCode.value.append(container.value)
})

watch(() => props.value, (val) => {
  if (qrCode.value && val) {
    qrCode.value.update({
      data: val,
    })
  }
})
</script>

<template>
  <div ref="container" />
</template> 