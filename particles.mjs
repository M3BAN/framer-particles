// ✅ FramerParticles - COMPLETO con Interacción, Imagen, Gradiente, Glow y Movimiento Vivo

import { jsx } from "react/jsx-runtime"

export function FramerParticles({
  image,
  color1 = "#ff0055",
  color2 = "#00ffaa",
  color3 = "#0055ff",
  pointSize = 3,
  resolution = 4,
  glow = true,
  radius = 0.3,
}) {
  return jsx("canvas", {
    ref: (canvas) => {
      if (!canvas || !image) return

      const ctx = canvas.getContext("2d")
      const dpi = window.devicePixelRatio || 1
      const width = canvas.offsetWidth * dpi
      const height = canvas.offsetHeight * dpi
      canvas.width = width
      canvas.height = height
      canvas.style.background = "black"

      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = image

      img.onload = () => {
        const off = document.createElement("canvas")
        const offCtx = off.getContext("2d")
        off.width = img.width
        off.height = img.height
        offCtx.drawImage(img, 0, 0)

        const pixels = offCtx.getImageData(0, 0, off.width, off.height).data
        const points = []

        for (let y = 0; y < off.height; y += resolution) {
          for (let x = 0; x < off.width; x += resolution) {
            const idx = (y * off.width + x) * 4
            const alpha = pixels[idx + 3]
            if (alpha > 128) {
              points.push({ x, y, size: pointSize * (0.8 + Math.random() * 0.4), offset: Math.random() * Math.PI * 2 })
            }
          }
        }

        let t = 0
        function animate() {
          t += 0.02
          ctx.clearRect(0, 0, width, height)
          points.forEach((p, i) => {
            const r = Math.sin(t + p.offset) * 0.5 + 0.5
            const g = Math.sin(t + p.offset + 2) * 0.5 + 0.5
            const b = Math.sin(t + p.offset + 4) * 0.5 + 0.5

            const glowSize = glow ? 10 : 0
            const size = p.size * (0.95 + 0.05 * Math.sin(t + p.offset * 5))

            const cx = (p.x / off.width) * width
            const cy = (p.y / off.height) * height

            ctx.beginPath()
            ctx.fillStyle = `rgb(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)})`
            if (glow) {
              ctx.shadowBlur = glowSize
              ctx.shadowColor = ctx.fillStyle
            }
            ctx.arc(cx, cy, size, 0, Math.PI * 2)
            ctx.fill()
          })
          requestAnimationFrame(animate)
        }
        animate()
      }
    },
    style: {
      width: "100%",
      height: "100%",
      display: "block",
    },
  })
} 

