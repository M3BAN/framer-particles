import { jsx } from "react/jsx-runtime"

export function FramerParticles({ color = "#ffffff" }) {
  return jsx("canvas", {
    ref: (canvas) => {
      if (!canvas) return

      const gl = canvas.getContext("webgl", { antialias: true })
      if (!gl) return

      // Retina scaling
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 1)

      // Convert hex to RGB
      const [r, g, b] = hexToRgb(color)

      // Vertex Shader
      const vertexShader = gl.createShader(gl.VERTEX_SHADER)
      gl.shaderSource(vertexShader, `
        attribute vec2 a_position;
        uniform vec2 u_mouse;
        uniform vec2 u_resolution;

        void main() {
          vec2 pos = a_position;

          // Normalize mouse
          vec2 mouse = (u_mouse / u_resolution) * 2.0 - 1.0;
          mouse.y *= -1.0;

          float dist = distance(pos, mouse);
          float force = 0.02 / (dist + 0.05);
          vec2 dir = normalize(pos - mouse);
          pos += dir * force;

          gl_Position = vec4(pos, 0.0, 1.0);
          gl_PointSize = 3.0;
        }
      `)
      gl.compileShader(vertexShader)

      // Fragment Shader
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
      gl.shaderSource(fragmentShader, `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(${r}, ${g}, ${b}, 1.0);
        }
      `)
      gl.compileShader(fragmentShader)

      // Program
      const program = gl.createProgram()
      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)
      gl.useProgram(program)

      // Particle positions
      const count = 1000
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

      // Uniforms
      const u_mouse = gl.getUniformLocation(program, "u_mouse")
      const u_resolution = gl.getUniformLocation(program, "u_resolution")

      const resolution = [canvas.width, canvas.height]
      gl.uniform2fv(u_resolution, resolution)

      // Mouse tracking
      const mouse = [0, 0]
      canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect()
        mouse[0] = (e.clientX - rect.left) * dpr
        mouse[1] = (e.clientY - rect.top) * dpr
      })

      // Draw loop
      function draw() {
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.uniform2fv(u_mouse, mouse)
        gl.drawArrays(gl.POINTS, 0, count)
        requestAnimationFrame(draw)
      }

      draw()
    },
    style: {
      width: "100%",
      height: "100%",
      display: "block",
    },
  })
}

// Helper: convert hex color to 0–1 RGB
function hexToRgb(hex) {
  hex = hex.replace("#", "")
  const bigint = parseInt(hex, 16)
  return [
    ((bigint >> 16) & 255) / 255,
    ((bigint >> 8) & 255) / 255,
    (bigint & 255) / 255,
  ]
}
