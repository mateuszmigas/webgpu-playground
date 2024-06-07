import {
  loadImageBitmap,
  createTextureFromSource,
} from "https://webgpufundamentals.org/3rdparty/webgpu-utils-1.x.module.js";

export async function runComputeDemo00() {
  // 1: request adapter and device
  if (!navigator.gpu) {
    throw Error("WebGPU not supported.");
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw Error("Couldn't request WebGPU adapter.");
  }

  const device = await adapter.requestDevice();

  const module = device.createShaderModule({
    label: "histogram shader",
    code: `
      @group(0) @binding(0) var<storage, read_write> bins: array<u32>;
      @group(0) @binding(1) var ourTexture: texture_2d<f32>;

      const kSRGBLuminanceFactors = vec3f(0.2126, 0.7152, 0.0722);
      fn srgbLuminance(color: vec3f) -> f32 {
        return saturate(dot(color, kSRGBLuminanceFactors));
      }

      @compute @workgroup_size(1, 1, 1)
      fn cs(@builtin(global_invocation_id) global_invocation_id: vec3u) {
        let numBins = f32(arrayLength(&bins));
        let lastBinIndex = u32(numBins - 1);
        let position = global_invocation_id.xy;
        let color = textureLoad(ourTexture, position, 0);
        let v = srgbLuminance(color.rgb);
        let bin = min(u32(v * numBins), lastBinIndex);
        bins[bin] += 1;
      }
    `,
  });

  const pipeline = device.createComputePipeline({
    label: "histogram",
    layout: "auto",
    compute: {
      module,
    },
  });

  const imgBitmap = await loadImageBitmap(
    "https://webgpufundamentals.org/webgpu/resources/images/pexels-francesco-ungaro-96938-mid.jpg"
  );
  const texture = createTextureFromSource(device, imgBitmap);

  const numBins = 256;
  const histogramBuffer = device.createBuffer({
    size: numBins * 4, // 256 entries * 4 bytes per (u32)
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  console.time("histogram");
  const resultBuffer = device.createBuffer({
    size: histogramBuffer.size,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  const bindGroup = device.createBindGroup({
    label: "histogram bindGroup",
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: histogramBuffer } },
      { binding: 1, resource: texture.createView() },
    ],
  });

  const encoder = device.createCommandEncoder({ label: "histogram encoder" });
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(texture.width, texture.height);
  pass.end();

  encoder.copyBufferToBuffer(
    histogramBuffer,
    0,
    resultBuffer,
    0,
    resultBuffer.size
  );

  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);

  await resultBuffer.mapAsync(GPUMapMode.READ);
  const histogram = new Uint32Array(resultBuffer.getMappedRange());

  showImageBitmap(imgBitmap);

  const numEntries = texture.width * texture.height;
  drawHistogram(histogram, numEntries);

  resultBuffer.unmap();
  console.timeEnd("histogram");
}

function drawHistogram(histogram, numEntries, height = 100) {
  const numBins = histogram.length;
  const max = Math.max(...histogram);
  const scale = Math.max(1 / max, (0.2 * numBins) / numEntries);

  const canvas = document.createElement("canvas");
  canvas.width = numBins;
  canvas.height = height;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#fff";

  for (let x = 0; x < numBins; ++x) {
    const v = histogram[x] * scale * height;
    ctx.fillRect(x, height - v, 1, v);
  }
}

function showImageBitmap(imageBitmap) {
  const canvas = document.createElement("canvas");
  canvas.width = imageBitmap.width / 5;
  canvas.height = imageBitmap.height / 5;

  const bm = canvas.getContext("bitmaprenderer");
  bm.transferFromImageBitmap(imageBitmap);
  document.body.appendChild(canvas);
}

