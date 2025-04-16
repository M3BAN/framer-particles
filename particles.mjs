// ✅ FramerParticles - Versión Completa con Interacción, Movimiento Suave y Dispersión

import { jsx } from "react/jsx-runtime"

export function FramerParticles({
  color = "#ffffff",
  count = 1000,
  pointSize = 2,
  radius = 0.3,
}) {
  return jsx("canvas", {
    ref: (canvas) => {
      if (!canvas) return

      const gl = canvas.getContext("webgl", { antialias: true })
      if (!gl) return

      const dpi = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpi
      canvas.height = canvas.offsetHeight * dpi
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0.0, 0.0, 0.0, 1.0)

      // Convert color
      const [r, g, b] = hexToRgb(color)

      // Shaders
      const vertexShader = gl.createShader(gl.VERTEX_SHADER)
      gl.shaderSource(
        vertexShader,
        `
        precision highp float;
        attribute vec2 a_position;
        attribute float a_size;
        attribute float a_alpha;
        uniform vec2 u_mouse;
        uniform float u_radius;
        uniform float u_time;
        varying float v_alpha;

        void main() {
          float dist = distance(a_position, u_mouse);
          float repel = smoothstep(u_radius, 0.0, dist);
          vec2 dir = normalize(a_position - u_mouse);
          vec2 offset = dir * repel * 0.5;
          vec2 pos = a_position + offset;
          
          gl_Position = vec4(pos, 0.0, 1.0);
          gl_PointSize = a_size * (1.0 - repel);
          v_alpha = a_alpha * (1.0 - repel);
        }
      `
      )
      gl.compileShader(vertexShader)

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
      gl.shaderSource(
        fragmentShader,
        `
        precision highp float;
        varying float v_alpha;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          gl_FragColor = vec4(${r / 255.0}, ${g / 255.0}, ${b / 255.0}, v_alpha);
        }
      `
      )
      gl.compileShader(fragmentShader)

      const program = gl.createProgram()
      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)
      gl.useProgram(program)

      // Attributes & Buffers
      const a_position = gl.getAttribLocation(program, "a_position")
      const a_size = gl.getAttribLocation(program, "a_size")
      const a_alpha = gl.getAttribLocation(program, "a_alpha")

      const pos = []
      const sizes = []
      const alphas = []

      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 2.0
        const y = (Math.random() - 0.5) * 2.0
        const d = Math.sqrt(x * x + y * y)
        if (d < radius) {
          pos.push(x, y)
          sizes.push(pointSize)
          alphas.push(1.0)
        }
      }

      const posBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW)
      gl.enableVertexAttribArray(a_position)
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0)

      const sizeBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW)
      gl.enableVertexAttribArray(a_size)
      gl.vertexAttribPointer(a_size, 1, gl.FLOAT, false, 0, 0)

      const alphaBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.STATIC_DRAW)
      gl.enableVertexAttribArray(a_alpha)
      gl.vertexAttribPointer(a_alpha, 1, gl.FLOAT, false, 0, 0)

      const u_mouse = gl.getUniformLocation(program, "u_mouse")
      const u_radius = gl.getUniformLocation(program, "u_radius")
      const u_time = gl.getUniformLocation(program, "u_time")

      let mouse = [0, 0]
      let smoothMouse = [0, 0]
      let timeStart = performance.now()

      canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        const y = ((e.clientY - rect.top) / rect.height) * -2 + 1
        mouse = [x, y]
      }

      function animate() {
        const now = performance.now()
        const elapsed = (now - timeStart) / 1000

        // Suavizado de cursor
        smoothMouse[0] += (mouse[0] - smoothMouse[0]) * 0.08
        smoothMouse[1] += (mouse[1] - smoothMouse[1]) * 0.08

        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.uniform2fv(u_mouse, smoothMouse)
        gl.uniform1f(u_radius, radius)
        gl.uniform1f(u_time, elapsed)
        gl.drawArrays(gl.POINTS, 0, pos.length / 2)
        requestAnimationFrame(animate)
      }
      animate()
    },
    style: {
      width: "100%",
      height: "100%",
      display: "block",
    },
  })
}

function hexToRgb(hex) {
  const parsed = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return parsed ? [parseInt(parsed[1], 16), parseInt(parsed[2], 16), parseInt(parsed[3], 16)] : [255, 255, 255]
}
