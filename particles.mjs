import { jsx } from "react/jsx-runtime"

export function FramerParticles({
  color = "#ffffff",
  count = 1000,
  radius = 0.3,
  pointSize = 2,
}) {
  return jsx("canvas", {
    ref: (canvas) => {
      if (!canvas) return

      const gl = canvas.getContext("webgl", { antialias: true })
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 1)

      const [r, g, b] = hexToRgb(color)

      // SHADERS
      const vertexShader = gl.createShader(gl.VERTEX_SHADER)
      gl.shaderSource(vertexShader, `
        attribute vec2 a_position;
        uniform vec2 u_mouse;
        uniform float u_radius;

        void main() {
          vec2 pos = a_position;

          // Apply repulsion
          vec2 diff = pos - u_mouse;
          float dist = length(diff);
          if (dist < u_radius) {
            float force = (u_radius - dist) * 0.02;
            pos += normalize(diff) * force;
          }

          gl_Position = vec4(pos, 0.0, 1.0);
          gl_PointSize = ${pointSize.toFixed(1)};
        }
      `)
      gl.compileShader(vertexShader)

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
      gl.shaderSource(fragmentShader, `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(${r}, ${g}, ${b}, 1.0);
        }
      `)
      gl.compileShader(fragmentShader)

      const program = gl.createProgram()
      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)
      gl.useProgram(program)

      const positions = new Float32Array(count * 2)
      for (let i = 0; i < count; i++) {
        positions[i * 2] = Math.random() * 2 - 1
        positions[i * 2 + 1] = Math.random() * 2 - 1
      }

      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

      const loc = gl.getAttribLocation(program, "a_position")
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

      const u_mouse = gl.getUniformLocation(program, "u_mouse")
      const u_radius = gl.getUniformLocation(program, "u_radius")

      const mouse = [1000, 1000] // fuera de pantalla por defecto

      canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
        mouse[0] = x
        mouse[1] = y
      })

      function draw() {
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.uniform2fv(u_mouse, mouse)
        gl.uniform1f(u_radius, radius)
        gl.drawArrays(gl.POINTS, 0, count)
        requestAnimationFrame(draw)
      }

      draw()
    },
    style: { width: "100%", height: "100%", display: "block" },
  })
}

function hexToRgb(hex) {
  hex = hex.replace("#", "")
  const bigint = parseInt(hex, 16)
  return [
    ((bigint >> 16) & 255) / 255,
    ((bigint >> 8) & 255) / 255,
    (bigint & 255) / 255,
  ]
}
