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

      canvas.width = canvas.offsetWidth * devicePixelRatio
      canvas.height = canvas.offsetHeight * devicePixelRatio
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 1)

      // Vertex Shader
      const vertexShader = gl.createShader(gl.VERTEX_SHADER)
      gl.shaderSource(vertexShader, `
        attribute vec2 a_position;
        attribute float a_size;
        attribute float a_alpha;
        uniform float u_time;
        uniform vec2 u_mouse;
        varying float v_alpha;
        void main() {
          float dist = distance(a_position, u_mouse);
          vec2 pos = a_position + normalize(a_position - u_mouse) * 0.05 / (dist + 0.1);
          gl_Position = vec4(pos, 0.0, 1.0);
          gl_PointSize = a_size * (1.0 - smoothstep(0.0, 0.5, dist));
          v_alpha = 1.0 - smoothstep(0.1, 0.6, dist);
        }
      `)
      gl.compileShader(vertexShader)

      // Fragment Shader
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
      const [r, g, b] = hexToRgb(color)
      gl.shaderSource(fragmentShader, `
        precision mediump float;
        varying float v_alpha;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          gl_FragColor = vec4(${r / 255}, ${g / 255}, ${b / 255}, v_alpha);
        }
      `)
      gl.compileShader(fragmentShader)

      // Program
      const program = gl.createProgram()
      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)
      gl.useProgram(program)

      const positions = []
      const sizes = []
      const alphas = []
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * 2 * Math.PI
        const rad = Math.sqrt(Math.random()) * radius
        positions.push(Math.cos(angle) * rad, Math.sin(angle) * rad)
        sizes.push(pointSize + Math.random())
        alphas.push(1)
      }

      const posBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
      const posLoc = gl.getAttribLocation(program, "a_position")
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

      const sizeBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW)
      const sizeLoc = gl.getAttribLocation(program, "a_size")
      gl.enableVertexAttribArray(sizeLoc)
      gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0)

      const alphaBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.STATIC_DRAW)
      const alphaLoc = gl.getAttribLocation(program, "a_alpha")
      gl.enableVertexAttribArray(alphaLoc)
      gl.vertexAttribPointer(alphaLoc, 1, gl.FLOAT, false, 0, 0)

      const mouseLoc = gl.getUniformLocation(program, "u_mouse")
      const timeLoc = gl.getUniformLocation(program, "u_time")

      let mouseX = 0, mouseY = 0
      let smoothX = 0, smoothY = 0

      canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect()
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1
        mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      })

      function render(time) {
        gl.clear(gl.COLOR_BUFFER_BIT)
        smoothX += (mouseX - smoothX) * 0.05
        smoothY += (mouseY - smoothY) * 0.05
        gl.uniform2f(mouseLoc, smoothX, smoothY)
        gl.uniform1f(timeLoc, time * 0.001)
        gl.drawArrays(gl.POINTS, 0, count)
        requestAnimationFrame(render)
      }
      render(0)
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
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]
}
