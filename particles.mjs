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

            const DPR = window.devicePixelRatio || 1
            canvas.width = canvas.offsetWidth * DPR
            canvas.height = canvas.offsetHeight * DPR
            gl.viewport(0, 0, canvas.width, canvas.height)
            gl.clearColor(0, 0, 0, 1)
            gl.clear(gl.COLOR_BUFFER_BIT)

            const [r, g, b] = hexToRgb(color)

            const vertexShader = gl.createShader(gl.VERTEX_SHADER)
            gl.shaderSource(
                vertexShader,
                `
                precision mediump float;
                attribute vec2 a_position;
                uniform vec2 u_mouse;
                uniform float u_radius;
                uniform float u_pointSize;
                varying float v_dist;

                void main() {
                    vec2 diff = a_position - u_mouse;
                    float dist = length(diff);
                    v_dist = dist;

                    vec2 offset = normalize(diff) * smoothstep(u_radius, 0.0, dist) * 0.15;
                    vec2 pos = a_position + offset;

                    gl_Position = vec4(pos, 0, 1);
                    gl_PointSize = u_pointSize * (1.0 - smoothstep(0.0, u_radius, dist));
                }
            `
            )
            gl.compileShader(vertexShader)

            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
            gl.shaderSource(
                fragmentShader,
                `
                precision mediump float;
                uniform vec3 u_color;
                varying float v_dist;

                void main() {
                    float alpha = 1.0 - smoothstep(0.0, 1.0, v_dist);
                    gl_FragColor = vec4(u_color, alpha);
                }
            `
            )
            gl.compileShader(fragmentShader)

            const program = gl.createProgram()
            gl.attachShader(program, vertexShader)
            gl.attachShader(program, fragmentShader)
            gl.linkProgram(program)
            gl.useProgram(program)

            const a_position = gl.getAttribLocation(program, "a_position")
            const u_color = gl.getUniformLocation(program, "u_color")
            const u_mouse = gl.getUniformLocation(program, "u_mouse")
            const u_radius = gl.getUniformLocation(program, "u_radius")
            const u_pointSize = gl.getUniformLocation(program, "u_pointSize")

            const positions = []
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2
                const rad = Math.sqrt(Math.random()) * 0.5
                const x = Math.cos(angle) * rad
                const y = Math.sin(angle) * rad
                positions.push(x, y)
            }

            const buffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
            gl.enableVertexAttribArray(a_position)
            gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0)

            gl.uniform3f(u_color, r / 255, g / 255, b / 255)
            gl.uniform1f(u_radius, radius)
            gl.uniform1f(u_pointSize, pointSize)

            let mouse = { x: 0, y: 0 }
            let targetMouse = { x: 0, y: 0 }

            const lerp = (a, b, t) => a + (b - a) * t

            canvas.addEventListener("mousemove", (e) => {
                const rect = canvas.getBoundingClientRect()
                const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
                const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
                targetMouse.x = x
                targetMouse.y = y
            })

            function render() {
                gl.clear(gl.COLOR_BUFFER_BIT)

                mouse.x = lerp(mouse.x, targetMouse.x, 0.05)
                mouse.y = lerp(mouse.y, targetMouse.y, 0.05)

                gl.uniform2f(u_mouse, mouse.x, mouse.y)
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
