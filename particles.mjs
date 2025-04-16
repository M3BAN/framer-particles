import { jsx } from "react/jsx-runtime"

export function FramerParticles({ color = "#ffffff" }) {
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
      const vertexShader = gl.createShader(gl.VERTEX_SHADER)
      gl.shaderSource(vertexShader, `
        attribute vec2 a_position;
        void main() {
          gl_PointSize = 3.0;
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `)
      gl.compileShader(vertexShader)

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
      gl.shaderSource(fragmentShader, `
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

      const particles = new Float32Array(1000 * 2)
      for (let i = 0; i < 1000; i++) {
        particles[i * 2] = Math.random() * 2 - 1
        particles[i * 2 + 1] = Math.random() * 2 - 1
      }

      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, particles, gl.STATIC_DRAW)
      const loc = gl.getAttribLocation(program, "a_position")
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.POINTS, 0, 1000)
    },
    style: {
      width: "100%",
      height: "100%",
      display: "block"
    }
  })
}

function hexToRgb(hex) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  return m ? [
    parseInt(m[1], 16) / 255,
    parseInt(m[2], 16) / 255,
    parseInt(m[3], 16) / 255
  ] : [1, 1, 1]
}

FramerParticles.propertyControls = {
  color: { type: "color", defaultValue: "#ffffff" }
}
