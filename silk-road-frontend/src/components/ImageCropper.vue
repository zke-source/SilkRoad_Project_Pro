<template>
  <el-dialog v-model="visibleLocal" :title="title" width="720px">
    <div class="cropper-wrap">
      <img ref="imgRef" class="cropper-img" />
    </div>
    <div class="toolbar">
      <el-button @click="zoom(0.1)">放大</el-button>
      <el-button @click="zoom(-0.1)">缩小</el-button>
      <el-button @click="rotate(90)">右转</el-button>
      <el-button @click="rotate(-90)">左转</el-button>
      <el-select v-model="ratio" style="width: 140px">
        <el-option :value="16/9" label="16:9" />
        <el-option :value="4/3" label="4:3" />
        <el-option :value="1" label="1:1" />
        <el-option :value="3/4" label="3:4" />
      </el-select>
    </div>
    <template #footer>
      <el-button @click="onCancel">取消</el-button>
      <el-button type="primary" @click="onConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

const props = defineProps({
  visible: { type: Boolean, default: false },
  file: { type: [File, Blob, Object], default: null },
  aspectRatio: { type: Number, default: 16 / 9 },
  title: { type: String, default: '裁剪图片' }
})
const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const visibleLocal = ref(false)
const imgRef = ref(null)
let cropper = null
const objectUrl = ref('')
const ratio = ref(props.aspectRatio)

watch(() => props.visible, async (v) => {
  visibleLocal.value = v
  if (v && props.file) {
    if (objectUrl.value) {
      URL.revokeObjectURL(objectUrl.value)
      objectUrl.value = ''
    }
    objectUrl.value = URL.createObjectURL(props.file)
    await nextTick()
    if (imgRef.value) {
      imgRef.value.src = objectUrl.value
      if (cropper) cropper.destroy()
      cropper = new Cropper(imgRef.value, {
        aspectRatio: ratio.value,
        viewMode: 1,
        autoCropArea: 1,
        responsive: true,
        background: false,
        movable: true,
        zoomable: true,
        rotatable: true
      })
    }
  }
})

watch(ratio, (r) => {
  if (cropper) {
    cropper.setAspectRatio(r)
  }
})

const zoom = (delta) => {
  if (cropper) cropper.zoom(delta)
}

const rotate = (deg) => {
  if (cropper) cropper.rotate(deg)
}

const onCancel = () => {
  emit('update:visible', false)
  emit('cancel')
}

const onConfirm = async () => {
  if (!cropper) {
    emit('update:visible', false)
    return
  }
  const canvas = cropper.getCroppedCanvas({ imageSmoothingQuality: 'high' })
  let type = props.file && props.file.type ? props.file.type : 'image/png'
  if (type === 'image/jpg') type = 'image/jpeg'
  const toBlobOnce = (q, t) => new Promise(resolve => {
    try {
      canvas.toBlob(b => resolve(b), t, q)
    } catch {
      resolve(null)
    }
  })
  let blob = await toBlobOnce(0.92, type)
  if (!blob || !blob.size) {
    try {
      const dataUrl = canvas.toDataURL(type, 0.92)
      blob = await fetch(dataUrl).then(r => r.blob())
    } catch {
      blob = null
    }
  }
  if (blob && blob.size > 3 * 1024 * 1024) {
    if (type !== 'image/jpeg') {
      type = 'image/jpeg'
    }
    let q = 0.85
    while (q >= 0.6 && blob.size > 3 * 1024 * 1024) {
      const b = await toBlobOnce(q, type)
      if (b && b.size) blob = b
      q -= 0.1
    }
  }
  emit('confirm', blob)
  emit('update:visible', false)
}

onUnmounted(() => {
  if (cropper) cropper.destroy()
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
})
</script>

<style scoped>
.cropper-wrap {
  width: 100%;
  height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f6f7fb;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
}
.cropper-img {
  max-width: 100%;
  display: block;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  align-items: center;
}
</style>
