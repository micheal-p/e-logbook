<script setup lang="ts">
// A small canvas signature pad (mouse + touch). Parent calls toDataURL().
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let drawing = false
let dirty = false

onMounted(() => {
  const c = canvas.value!
  const ratio = window.devicePixelRatio || 1
  const rect = c.getBoundingClientRect()
  c.width = rect.width * ratio
  c.height = rect.height * ratio
  ctx = c.getContext('2d')
  if (ctx) {
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#021E40'
  }
})

function pos(e: PointerEvent) {
  const r = canvas.value!.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}
function down(e: PointerEvent) {
  drawing = true
  const p = pos(e)
  ctx!.beginPath()
  ctx!.moveTo(p.x, p.y)
  canvas.value!.setPointerCapture(e.pointerId)
}
function move(e: PointerEvent) {
  if (!drawing) return
  const p = pos(e)
  ctx!.lineTo(p.x, p.y)
  ctx!.stroke()
  dirty = true
}
function up() {
  drawing = false
}
function clear() {
  ctx?.clearRect(0, 0, canvas.value!.width, canvas.value!.height)
  dirty = false
}

defineExpose({
  clear,
  isEmpty: () => !dirty,
  toDataURL: () => (dirty ? canvas.value!.toDataURL('image/png') : null),
})
</script>

<template>
  <div>
    <canvas
      ref="canvas"
      class="h-40 w-full touch-none rounded-lg border border-gray-300 bg-white"
      @pointerdown="down"
      @pointermove="move"
      @pointerup="up"
      @pointerleave="up"
    />
    <button type="button" class="mt-1 text-xs text-caleb-cyan-dark hover:underline" @click="clear">
      Clear signature
    </button>
  </div>
</template>
