// Define global buffer size
const BUFFER_SIZE = 10000 * 4 * 4;

// Compute shader
const shader = `
@group(0) @binding(0)
var<storage, read_write> input: array<f32>;
@group(0) @binding(1)
var<storage, read_write> output: array<f32>;

@compute @workgroup_size(64)
fn main(
  @builtin(global_invocation_id)
  global_id : vec3u,

  @builtin(local_invocation_id)
  local_id : vec3u,
) {
  // Avoid accessing the buffer out of bounds
  if (global_id.x >= ${BUFFER_SIZE}u) {
    return;
  }

  output[global_id.x] = input[global_id.x] / 2;
    // f32(global_id.x) * 1000. + f32(local_id.x);
}
`;

export async function runComputeDemo2(
  canvasSource: HTMLCanvasElement,
  canvasTarget: HTMLCanvasElement
) {
  if (!navigator.gpu) {
    throw Error("WebGPU not supported.");
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw Error("Couldn't request WebGPU adapter.");
  }

  const device = await adapter.requestDevice();

  const shaderModule = device.createShaderModule({
    code: shader,
  });

  const input = device.createBuffer({
    size: BUFFER_SIZE,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });

  const imageData = canvasSource
    .getContext("2d")!
    .getImageData(0, 0, canvasSource.width, canvasSource.height).data;
  const data2 = new Float32Array(imageData.length);

  for (let i = 0; i < imageData.length; i++) {
    data2[i] = imageData[i];
  }

  console.log(data2);

  const mappedBuffer = input.getMappedRange();
  new Float32Array(mappedBuffer).set(data2);
  input.unmap();
  const output = device.createBuffer({
    size: BUFFER_SIZE,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  const stagingBuffer = device.createBuffer({
    size: BUFFER_SIZE,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" },
      },
    ],
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: input } },
      { binding: 1, resource: { buffer: output } },
    ],
  });

  const computePipeline = device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    }),
    compute: {
      module: shaderModule,
      entryPoint: "main",
    },
  });

  const commandEncoder = device.createCommandEncoder();
  const passEncoder = commandEncoder.beginComputePass();
  passEncoder.setPipeline(computePipeline);
  passEncoder.setBindGroup(0, bindGroup);
  passEncoder.dispatchWorkgroups(Math.ceil(BUFFER_SIZE / 64));
  passEncoder.end();

  commandEncoder.copyBufferToBuffer(output, 0, stagingBuffer, 0, BUFFER_SIZE);

  device.queue.submit([commandEncoder.finish()]);

  await stagingBuffer.mapAsync(GPUMapMode.READ, 0, BUFFER_SIZE);

  const copyArrayBuffer = stagingBuffer.getMappedRange(0, BUFFER_SIZE);
  const result = copyArrayBuffer.slice(0);
  stagingBuffer.unmap();

  const float32Array = new Float32Array(result);

  // Convert to Uint8ClampedArray
  const uint8ClampedArray = new Uint8ClampedArray(float32Array.length);

  for (let i = 0; i < float32Array.length; i++) {
    uint8ClampedArray[i] = Math.min(255, Math.max(0, float32Array[i]));
  }

  console.log("output", uint8ClampedArray);

  canvasTarget
    .getContext("2d")!
    .putImageData(new ImageData(uint8ClampedArray, 100, 100), 0, 0);
}

