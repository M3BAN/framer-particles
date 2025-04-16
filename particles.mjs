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
      if (!gl) return

      canvas.width = canvas.offsetWidth * devicePixelRatio
      canvas.height = canvas.offsetHeight * devicePixelRatio
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 1)

      const [r, g, b] = hexToRgb(color)

      const vs = gl.createShader(gl.VERTEX_SHADER)
      gl.shaderSource(vs, \`
        attribute vec2 a_position;
        attribute vec2 a_origin;
        uniform vec2 u_mouse;
        uniform float u_time;
        uniform float u_radius;
        varying float v_alpha;
        void main() {
          float dist = distance(a_position, u_mouse);
          float force = smoothstep(u_radius, 0.0, dist);
          vec2 offset = normalize(a_position - u_mouse) * force * 0.4;
          vec2 pos = mix(a_origin, a_origin + offset, 0.95);
          gl_Position = vec4(pos, 0.0, 1.0);
          gl_PointSize = mix(${pointSize.toFixed(1)}, 0.0, force);
          v_alpha = 1.0 - force;
        }
      \`)
      gl.compileShader(vs)

      const fs = gl.createShader(gl.FRAGMENT_SHADER)
      gl.shaderSource(fs, \`
        precision mediump float;
        varying float v_alpha;
        void main() {
          gl_FragColor = vec4(${r / 255}, ${g / 255}, ${b / 255}, v_alpha);
        }
      \`)
      gl.compileShader(fs)

      const program = gl.createProgram()
      gl.attachShader(program, vs)
      gl.attachShader(program, fs)
      gl.linkProgram(program)
      gl.useProgram(program)

      const origins = new Float32Array(count * 4)
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const rad = Math.random() * radius
        const x = Math.cos(angle) * rad
        const y = Math.sin(angle) * rad
        origins[i * 4 + 0] = x
        origins[i * 4 + 1] = y
        origins[i * 4 + 2] = x
        origins[i * 4 + 3] = y
      }

      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, origins, gl.STATIC_DRAW)

      const a_position = gl.getAttribLocation(program, "a_position")
      const a_origin = gl.getAttribLocation(program, "a_origin")
      gl.enableVertexAttribArray(a_position)
      gl.enableVertexAttribArray(a_origin)
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 16, 0)
      gl.vertexAttribPointer(a_origin, 2, gl.FLOAT, false, 16, 8)

      const u_mouse = gl.getUniformLocation(program, "u_mouse")
      const u_radius = gl.getUniformLocation(program, "u_radius")

      let mouse = [0, 0]
      canvas.addEventListener("mousemove", (e) => {
        const x = (e.offsetX / canvas.offsetWidth) * 2 - 1
        const y = (e.offsetY / canvas.offsetHeight) * -2 + 1
        mouse = [x, y]
      })

      function render() {
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.uniform2fv(u_mouse, mouse)
        gl.uniform1f(u_radius, radius)
        gl.drawArrays(gl.POINTS, 0, count)
        requestAnimationFrame(render)
      }
      render()
    },
    style: {
      width: "100%",
      height: "100%",
      display: "block",
    },
  })
}

function hexToRgb(hex) {
  hex = hex.replace("#", "")
  const bigint = parseInt(hex, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return [r, g, b]
}
