// particles.mjs (VERSIÓN REESCRITA con animación e interacción)

import { jsx } from "react/jsx-runtime"

export function FramerParticles({ color = "#ffffff", count = 1000, pointSize = 2.0, radius = 0.4 }) {
  return jsx("canvas", {
    style: {
      width: "100%",
      height: "100%",
      display: "block",
      background: "black",
    },
    ref: (canvas) => {
      if (!canvas) return
      const gl = canvas.getContext("webgl", { antialias: true })
      if (!gl) return

      const dpi = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpi
      canvas.height = canvas.offsetHeight * dpi
      gl.viewport(0, 0, canvas.width, canvas.height)

      const [r, g, b] = hexToRgb(color)

      const vertexShader = gl.createShader(gl.VERTEX_SHADER)
      gl.shaderSource(vertexShader, `
        attribute vec2 a_position;
        attribute float a_size;

        uniform float u_time;
        uniform vec2 u_mouse;
        uniform vec2 u_resolution;

        varying float v_dist;

        void main() {
          vec2 pos = a_position;

          float d = distance(pos, u_mouse);
          float force = clamp(1.0 - d / ${radius.toFixed(1)}, 0.0, 1.0);

          pos += normalize(pos - u_mouse) * force * 0.1;

          v_dist = force;

          vec2 clipSpace = (pos / u_resolution) * 2.0 - 1.0;
          gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
          gl_PointSize = a_size * (1.0 - force);
        }
      `)
      gl.compileShader(vertexShader)

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
      gl.shaderSource(fragmentShader, `
        precision mediump float;
        varying float v_dist;
        void main() {
          float alpha = 1.0 - v_dist;
          gl_FragColor = vec4(${r / 255}, ${g / 255}, ${b / 255}, alpha);
        }
      `)
      gl.compileShader(fragmentShader)

      const program = gl.createProgram()
      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)
      gl.useProgram(program)

      const positions = []
      const sizes = []
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * 2 * Math.PI
        const dist = Math.sqrt(Math.random()) * radius * canvas.width
        const x = canvas.width / 2 + Math.cos(angle) * dist
        const y = canvas.height / 2 + Math.sin(angle) * dist
        positions.push(x, y)
        sizes.push(pointSize + Math.random())
      }

      const posBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
      const aPos = gl.getAttribLocation(program, "a_position")
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

      const sizeBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW)
      const aSize = gl.getAttribLocation(program, "a_size")
      gl.enableVertexAttribArray(aSize)
      gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, 0, 0)

      const uTime = gl.getUniformLocation(program, "u_time")
      const uMouse = gl.getUniformLocation(program, "u_mouse")
      const uRes = gl.getUniformLocation(program, "u_resolution")

      let mouse = [canvas.width / 2, canvas.height / 2]
      canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect()
        const x = (e.clientX - rect.left) * dpi
        const y = (e.clientY - rect.top) * dpi
        mouse = [x, y]
      })

      function draw(time) {
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.uniform1f(uTime, time * 0.001)
        gl.uniform2fv(uMouse, mouse)
        gl.uniform2f(uRes, canvas.width, canvas.height)
        gl.drawArrays(gl.POINTS, 0, count)
        requestAnimationFrame(draw)
      }

      gl.clearColor(0, 0, 0, 1)
      requestAnimationFrame(draw)
    },
  })
}

function hexToRgb(hex) {
  hex = hex.replace("#", "")
  const bigint = parseInt(hex, 16)
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]
}

