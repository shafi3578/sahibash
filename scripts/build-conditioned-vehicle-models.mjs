import { NodeIO } from "@gltf-transform/core";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "public/models/vehicles/toyota-corolla-2020.glb");
const outputPath = path.join(root, "public/models/vehicles/toyota-corolla-2020-conditioned.glb");
const io = new NodeIO();
const document = await io.read(sourcePath);
const rootNode = document.getRoot();
const buffer = rootNode.listBuffers()[0] ?? document.createBuffer();
const paintMaterial = rootNode.listMaterials().find((material) => material.getName() === "Paint_Color");

if (!paintMaterial) throw new Error("Corolla paint material was not found.");

const materialByPanel = new Map();
const panelMaterial = (panel) => {
  if (!materialByPanel.has(panel)) {
    materialByPanel.set(panel, paintMaterial.clone().setName(`condition__${panel}`));
  }
  return materialByPanel.get(panel);
};

function classify(x, y, z, bounds) {
  const nx = (x - bounds.cx) / bounds.hx;
  const ny = (y - bounds.minY) / (bounds.maxY - bounds.minY);
  const nz = (z - bounds.cz) / bounds.hz;
  const side = nx < 0 ? "left" : "right";

  if (nz > 0.9 && ny < 0.48) return "front_bumper";
  if (nz < -0.9 && ny < 0.5) return "rear_bumper";
  if (ny > 0.73 && Math.abs(nz) < 0.42 && Math.abs(nx) < 0.72) return "roof";
  if (nz > 0.42 && Math.abs(nx) < 0.65 && ny > 0.39) return "hood";
  if (nz < -0.48 && Math.abs(nx) < 0.68 && ny > 0.32) return "trunk";
  if (Math.abs(nx) > 0.48 && nz > 0.45) return `front_${side}_fender`;
  if (Math.abs(nx) > 0.48 && nz < -0.47) return `rear_${side}_fender`;
  if (Math.abs(nx) > 0.5 && nz >= -0.04 && nz <= 0.45) return `front_${side}_door`;
  if (Math.abs(nx) > 0.5 && nz < -0.04 && nz >= -0.47) return `rear_${side}_door`;
  return null;
}

let splitPrimitiveCount = 0;
for (const mesh of rootNode.listMeshes()) {
  for (const primitive of [...mesh.listPrimitives()]) {
    if (primitive.getMaterial() !== paintMaterial) continue;
    const position = primitive.getAttribute("POSITION");
    if (!position) continue;
    const positions = position.getArray();
    const sourceIndices = primitive.getIndices()?.getArray();
    const vertexCount = position.getCount();
    const indices = sourceIndices ? Array.from(sourceIndices) : Array.from({ length: vertexCount }, (_, index) => index);
    const min = position.getMin([]);
    const max = position.getMax([]);
    const bounds = { cx: (min[0] + max[0]) / 2, hx: (max[0] - min[0]) / 2, minY: min[1], maxY: max[1], cz: (min[2] + max[2]) / 2, hz: (max[2] - min[2]) / 2 };
    const groups = new Map([["original", []]]);

    for (let offset = 0; offset < indices.length; offset += 3) {
      const triangle = indices.slice(offset, offset + 3);
      if (triangle.length < 3) continue;
      let x = 0, y = 0, z = 0;
      for (const index of triangle) {
        x += positions[index * 3]; y += positions[index * 3 + 1]; z += positions[index * 3 + 2];
      }
      const panel = classify(x / 3, y / 3, z / 3, bounds) ?? "original";
      if (!groups.has(panel)) groups.set(panel, []);
      groups.get(panel).push(...triangle);
    }

    for (const [panel, groupIndices] of groups) {
      if (!groupIndices.length) continue;
      const IndexArray = vertexCount > 65535 ? Uint32Array : Uint16Array;
      const newPrimitive = document.createPrimitive().setMode(primitive.getMode());
      for (const semantic of primitive.listSemantics()) newPrimitive.setAttribute(semantic, primitive.getAttribute(semantic));
      newPrimitive.setIndices(document.createAccessor().setType("SCALAR").setArray(new IndexArray(groupIndices)).setBuffer(buffer));
      newPrimitive.setMaterial(panel === "original" ? paintMaterial : panelMaterial(panel));
      mesh.addPrimitive(newPrimitive);
    }
    mesh.removePrimitive(primitive);
    splitPrimitiveCount += 1;
  }
}

if (!splitPrimitiveCount) throw new Error("No Corolla paint primitive was split.");
await io.write(outputPath, document);
console.log(`Created ${path.relative(root, outputPath)} with ${materialByPanel.size} independently colorable body panels.`);
