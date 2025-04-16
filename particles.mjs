import { jsx } from "react/jsx-runtime"

export function FramerParticles({
  color = "#ffffff",
  count = 1000,
  pointSize = 2,
  radius = 0.3,
}) {
  return jsx("canvas", {
    style: {
      width: "100%",
      height: "100%",
      display: "block",
    },
    ref: (canvas) => {
      if (!canvas) return

      const gl = canvas.getContext("webgl", { antialias: true })
      if (!gl) return

      // Resize to fit pixel ratio
      const dpi = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpi
      canvas.height = canvas.offsetHeight * dpi
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 1)

      const [r, g, b] = hexToRgb(color)

      // Vertex shader
      const vertexShader = gl.createShader(gl.VERTEX_SHADER)
      gl.shaderSource(
        vertexShader,
        `
          attribute vec2 a_position;
          uniform float u_pointSize;
          uniform vec2 u_mouse;
          uniform float u_radius;
          varying float v_dist;

          void main() {
            vec2 diff = a_position - u_mouse;
            float dist = length(diff);
            v_dist = dist;

            vec2 displaced = a_position;
            if (dist < u_radius) {
              displaced += normalize(diff) * (u_radius - dist);
            }

            gl_Position = vec4(displaced, 0.0, 1.0);
            gl_PointSize = u_pointSize;
          }
        `
      )
      gl.compileShader(vertexShader)

      // Fragment shader
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
      gl.shaderSource(
        fragmentShader,
        `
          precision mediump float;
          uniform vec3 u_color;

          void main() {
            float dist = distance(gl_PointCoord, vec2(0.5));
            if (dist > 0.5) discard;
            gl_FragColor = vec4(u_color, 1.0);
          }
        `
      )
      gl.compileShader(fragmentShader)

      // Create program
      const program = gl.createProgram()
      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)
      gl.useProgram(program)

      // Particle positions
      const particles = new Float32Array(count * 2)
      for (let i = 0; i < count; i++) {
        particles[i * 2] = Math.random() * 2 - 1
        particles[i * 2 + 1] = Math.random() * 2 - 1
      }

      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, particles, gl.STATIC_DRAW)

      const a_position = gl.getAttribLocation(program, "a_position")
      gl.enableVertexAttribArray(a_position)
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0)

      const u_color = gl.getUniformLocation(program, "u_color")
      gl.uniform3f(u_color, r, g, b)

      const u_pointSize = gl.getUniformLocation(program, "u_pointSize")
      gl.uniform1f(u_pointSize, pointSize)

      const u_mouse = gl.getUniformLocation(program, "u_mouse")
      gl.uniform2f(u_mouse, 9999, 9999)

      const u_radius = gl.getUniformLocation(program, "u_radius")
      gl.uniform1f(u_radius, radius)

      // Mouse interaction
      canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        gl.uniform2f(u_mouse, x, y)
      })

      canvas.addEventListener("mouseleave", () => {
        gl.uniform2f(u_mouse, 9999, 9999)
      })

      // Render
      function render() {
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.drawArrays(gl.POINTS, 0, count)
        requestAnimationFrame(render)
      }

      render()
    },
  })
}

// Helper to convert #rrggbb to normalized [r, g, b]
function hexToRgb(hex) {
  const value = hex.replace("#", "")
  const bigint = parseInt(value, 16)
  const r = ((bigint >> 16) & 255) / 255
  const g = ((bigint >> 8) & 255) / 255
  const b = (bigint & 255) / 255
  return [r, g, b]
}
