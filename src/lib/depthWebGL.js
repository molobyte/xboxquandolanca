// Renderizador WebGL 2.5D com Steep Parallax Occlusion Mapping (Raymarching de 14 passos)
// + Iluminação de Relevo 3D baseada nas Normais do Mapa de Profundidade (Depth Anything V2)

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = vec2(a_position.x * 0.5 + 0.5, 0.5 - a_position.y * 0.5);
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

varying vec2 v_uv;
uniform sampler2D u_image;
uniform sampler2D u_depth;
uniform vec2 u_mouse;       // (-1..1, -1..1)
uniform float u_intensity;  // 0..1
uniform float u_showDepth;  // 0 = normal 3D parallax, 1 = visualizar mapa de profundidade

// Raymarching Parallax Occlusion Mapping (separa primeiro plano e fundo com oclusão real)
vec2 parallaxMapping(vec2 uv, vec2 viewDir) {
  const float numLayers = 14.0;
  float layerDepth = 1.0 / numLayers;
  float currentLayerDepth = 0.0;

  // Escala de deslocamento calibrada para parecer uma caixa 3D profunda sem rasgar bordas
  vec2 P = viewDir * 0.036;
  vec2 deltaUV = P / numLayers;

  vec2 currentUV = uv;
  // No Depth Anything: 1.0 (branco) = perto (primeiro plano), 0.0 (preto) = longe (fundo).
  // Invertemos para heightfield de profundidade onde 0.0 = topo (frente) e 1.0 = fundo.
  float currentDepthMapValue = 1.0 - texture2D(u_depth, currentUV).r;

  for (int i = 0; i < 14; i++) {
    if (currentLayerDepth >= currentDepthMapValue) {
      break;
    }
    currentUV -= deltaUV;
    currentDepthMapValue = 1.0 - texture2D(u_depth, currentUV).r;
    currentLayerDepth += layerDepth;
  }

  // Interpolação linear (Parallax Occlusion Mapping) entre o passo atual e o anterior para zero serrilhado
  vec2 prevUV = currentUV + deltaUV;
  float afterDepth = currentDepthMapValue - currentLayerDepth;
  float beforeDepth = (1.0 - texture2D(u_depth, prevUV).r) - currentLayerDepth + layerDepth;
  float weight = clamp(afterDepth / (afterDepth - beforeDepth + 0.0001), 0.0, 1.0);

  return mix(currentUV, prevUV, weight);
}

void main() {
  // Leve zoom de segurança (4.5%) proporcional à intensidade para evitar bordas vazias ao deslocar
  float zoom = 1.0 - (0.045 * u_intensity);
  vec2 baseUV = (v_uv - 0.5) * zoom + 0.5;

  // Direção do olhar baseada na posição interpolada do mouse
  vec2 viewDir = vec2(u_mouse.x, u_mouse.y) * u_intensity;

  // Calcula UV com oclusão de paralaxe real
  vec2 displacedUV = clamp(parallaxMapping(baseUV, viewDir), 0.002, 0.998);

  float depthVal = texture2D(u_depth, displacedUV).r;

  // Modo de inspeção do Mapa de Profundidade (colorização estilo plasma/viridis Xbox)
  if (u_showDepth > 0.5) {
    vec3 nearColor = vec3(0.32, 0.84, 0.15); // Verde Neon Xbox para primeiro plano
    vec3 midColor  = vec3(0.08, 0.45, 0.55); // Ciano intermediário
    vec3 farColor  = vec3(0.04, 0.05, 0.10); // Azul escuro profundo para o fundo
    vec3 viz = depthVal < 0.5
      ? mix(farColor, midColor, depthVal * 2.0)
      : mix(midColor, nearColor, (depthVal - 0.5) * 2.0);
    gl_FragColor = vec4(viz, 1.0);
    return;
  }

  vec4 color = texture2D(u_image, displacedUV);

  // Estima a normal 3D do relevo a partir dos vizinhos do mapa de profundidade
  float eps = 0.004;
  float dL = texture2D(u_depth, displacedUV - vec2(eps, 0.0)).r;
  float dR = texture2D(u_depth, displacedUV + vec2(eps, 0.0)).r;
  float dU = texture2D(u_depth, displacedUV - vec2(0.0, eps)).r;
  float dD = texture2D(u_depth, displacedUV + vec2(0.0, eps)).r;

  vec3 normal = normalize(vec3((dL - dR) * 3.5, (dU - dD) * 3.5, 1.0));
  vec3 lightDir = normalize(vec3(u_mouse.x * 1.2, -u_mouse.y * 1.2, 0.85));

  // Luz de relevo especular sutil nos contornos do personagem em primeiro plano
  float reliefHighlight = max(0.0, dot(normal, lightDir)) * u_intensity;
  float foregroundMask = smoothstep(0.35, 0.85, depthVal);

  // Sombra de oclusão sutil no plano de fundo para aumentar o contraste de profundidade
  float bgShadow = mix(1.0, 0.90 + 0.12 * foregroundMask, u_intensity * 0.65);

  vec3 finalRgb = color.rgb * bgShadow + vec3(1.0, 0.98, 0.95) * (pow(reliefHighlight, 3.0) * 0.11 * foregroundMask);

  gl_FragColor = vec4(finalRgb, color.a);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Erro no shader WebGL: ${info}`);
  }
  return shader;
}

function createTextureFromImage(gl, img, textureUnit) {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + textureUnit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  return tex;
}

export function createDepthParallaxRenderer(canvas, coverImg, depthImg) {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: true,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
  });

  if (!gl) return null;

  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return null;
  }

  gl.useProgram(program);

  // Quad em tela cheia (-1 a +1)
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );

  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uImageLoc = gl.getUniformLocation(program, 'u_image');
  const uDepthLoc = gl.getUniformLocation(program, 'u_depth');
  const uMouseLoc = gl.getUniformLocation(program, 'u_mouse');
  const uIntensityLoc = gl.getUniformLocation(program, 'u_intensity');
  const uShowDepthLoc = gl.getUniformLocation(program, 'u_showDepth');

  const imageTex = createTextureFromImage(gl, coverImg, 0);
  const depthTex = createTextureFromImage(gl, depthImg, 1);

  gl.uniform1i(uImageLoc, 0);
  gl.uniform1i(uDepthLoc, 1);

  const render = ({ px = 0, py = 0, intensity = 0, showDepth = false } = {}) => {
    const w = coverImg.naturalWidth || 600;
    const h = coverImg.naturalHeight || 900;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }

    gl.useProgram(program);
    gl.uniform2f(uMouseLoc, px, py);
    gl.uniform1f(uIntensityLoc, intensity);
    gl.uniform1f(uShowDepthLoc, showDepth ? 1.0 : 0.0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  // Render inicial em repouso
  render({ px: 0, py: 0, intensity: 0, showDepth: false });

  const destroy = () => {
    try {
      gl.deleteTexture(imageTex);
      gl.deleteTexture(depthTex);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    } catch {
      // ignora se contexto já foi perdido
    }
  };

  return { render, destroy };
}
