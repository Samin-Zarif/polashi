// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — War room: the camera, the table and where everyone sits
// The war room is Zarif's painted picture of the empty room (assets/images/war-room-wide.jpg)
// with the stone statues drawn in 3D on top of it. These numbers describe the camera
// the picture was painted from, so the 3D statues line up with the painted table and
// floor. They were measured from the picture; change them only together with it.
// Units: picture pixels and metres. The table centre on the floor is (0, 0, 0),
// y is up and z points towards the camera.
// ─────────────────────────────────────────────────────────────────────────────

export const WAR_ROOM = {
  image: '/assets/images/war-room-wide.jpg',

  // picture space: the picture file's own pixels
  width: 3392,
  height: 1247,

  // camera, fitted to the painted table and to where the picture's upright and receding lines meet
  focal: 1620.0,          // lens focal length in picture pixels
  centerX: 1722.64,       // where the lens axis meets the picture
  centerY: 181.84,
  pitchDeg: 16.3002,      // camera looks down by this much
  cameraPos: [0.1023, 5.8929, 7.6085],
  tableY: 0.76,           // height of the painted table top

  // flames of the six wall torches (picture pixels) for the flicker; size scales their light
  torches: [
    { x: 1317, y: 185, size: 1.25 },
    { x: 2077, y: 186, size: 1.25 },
    { x: 1087, y: 240, size: 1.0 },
    { x: 2302, y: 237, size: 1.0 },
    { x: 200, y: 660, size: 1.1 },
    { x: 3193, y: 685, size: 1.1 },
  ],
  torchTop: 160,          // top of the highest flame, kept in view on wide screens
};

// The painted table's top edge seen from above (x, z in metres), traced from the picture.
export const TABLE_OUTLINE = [
  [-1.34, -0], [-1.341, -0.07], [-1.339, -0.141], [-1.334, -0.211], [-1.326, -0.282], [-1.316, -0.353], [-1.303,
  -0.423], [-1.284, -0.493], [-1.26, -0.561], [-1.23, -0.627], [-1.196, -0.691], [-1.158, -0.752], [-1.118,
  -0.812], [-1.074, -0.869], [-1.026, -0.924], [-0.976, -0.976], [-0.923, -1.025], [-0.866, -1.069], [-0.806,
  -1.11], [-0.745, -1.147], [-0.682, -1.181], [-0.618, -1.213], [-0.552, -1.24], [-0.485, -1.264], [-0.417,
  -1.284], [-0.349, -1.301], [-0.28, -1.315], [-0.21, -1.327], [-0.14, -1.335], [-0.07, -1.34], [0, -1.342],
  [0.07, -1.341], [0.141, -1.337], [0.211, -1.329], [0.28, -1.317], [0.349, -1.301], [0.416, -1.279], [0.481,
  -1.253], [0.544, -1.223], [0.606, -1.189], [0.666, -1.154], [0.724, -1.116], [0.781, -1.075], [0.836, -1.032],
  [0.889, -0.987], [0.941, -0.941], [0.991, -0.893], [1.039, -0.841], [1.084, -0.787], [1.125, -0.731], [1.163,
  -0.671], [1.197, -0.61], [1.227, -0.546], [1.254, -0.481], [1.276, -0.415], [1.296, -0.347], [1.312, -0.279],
  [1.324, -0.21], [1.333, -0.14], [1.337, -0.07], [1.338, 0], [1.336, 0.07], [1.331, 0.14], [1.324, 0.21],
  [1.314, 0.279], [1.302, 0.349], [1.287, 0.418], [1.268, 0.487], [1.244, 0.554], [1.214, 0.619], [1.18, 0.682],
  [1.143, 0.742], [1.103, 0.801], [1.059, 0.857], [1.012, 0.911], [0.962, 0.962], [0.909, 1.009], [0.853,
  1.054], [0.796, 1.096], [0.738, 1.136], [0.678, 1.174], [0.616, 1.209], [0.552, 1.24], [0.486, 1.266], [0.418,
  1.288], [0.35, 1.305], [0.28, 1.318], [0.211, 1.329], [0.141, 1.337], [0.07, 1.342], [0, 1.344], [-0.07,
  1.341], [-0.14, 1.336], [-0.21, 1.327], [-0.279, 1.314], [-0.348, 1.299], [-0.416, 1.28], [-0.482, 1.257],
  [-0.547, 1.229], [-0.61, 1.198], [-0.671, 1.162], [-0.73, 1.124], [-0.788, 1.084], [-0.844, 1.043], [-0.9,
  0.999], [-0.953, 0.953], [-1.004, 0.904], [-1.051, 0.851], [-1.096, 0.796], [-1.136, 0.738], [-1.173, 0.677],
  [-1.206, 0.615], [-1.235, 0.55], [-1.26, 0.484], [-1.28, 0.416], [-1.297, 0.347], [-1.31, 0.279], [-1.322,
  0.209], [-1.331, 0.14], [-1.337, 0.07]
];

// Distance from the table centre to its edge in the direction phi (radians, from +x towards +z).
const POLAR = TABLE_OUTLINE.map(([x, z]) => [Math.atan2(z, x), Math.hypot(x, z)]).sort((a, b) => a[0] - b[0]);
export function tableEdge(phi) {
  const a = Math.atan2(Math.sin(phi), Math.cos(phi));
  const n = POLAR.length;
  for (let i = 0; i < n; i++) {
    const [a0, r0] = POLAR[i];
    const [a1raw, r1] = POLAR[(i + 1) % n];
    const a1 = i === n - 1 ? a1raw + 2 * Math.PI : a1raw;
    const aa = a < POLAR[0][0] ? a + 2 * Math.PI : a;
    if (aa >= a0 && aa <= a1) return r0 + ((r1 - r0) * (aa - a0)) / Math.max(1e-9, a1 - a0);
  }
  return POLAR[0][1];
}

// Where each chair stands. Seat 0 (you) is at the front, back to the camera; the others
// follow round the table to the left, evenly spaced. Each statue faces the table centre.
//   x, z: chair centre on the floor;  yaw: turn about the vertical axis (radians)
export const SEAT_GAP = 0.16;     // from the table edge to the middle of the chair seat (m)
export function seatFrames(n) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const phi = Math.PI / 2 + (2 * Math.PI * k) / n;
    const d = tableEdge(phi) + SEAT_GAP;
    const x = d * Math.cos(phi), z = d * Math.sin(phi);
    out.push({ x, z, yaw: Math.atan2(-x, -z), phi, edge: d - SEAT_GAP });
  }
  return out;
}

// A point in a seat's own frame (x right, y up, z towards the table) -> the room.
export function seatToRoom(seat, [lx, ly, lz]) {
  const c = Math.cos(seat.yaw), s = Math.sin(seat.yaw);
  return [seat.x + lx * c + lz * s, ly, seat.z - lx * s + lz * c];
}

// A point in the room -> picture pixels [u, v] (and its distance in front of the camera).
export function projectToPicture([x, y, z], room = WAR_ROOM) {
  const th = (room.pitchDeg * Math.PI) / 180;
  const c = Math.cos(th), s = Math.sin(th);
  const [cx0, cy0, cz0] = room.cameraPos;
  const vx = x - cx0, vy = y - cy0, vz = z - cz0;
  const up = vy * c - vz * s;
  const fwd = -vy * s - vz * c;
  return [room.centerX + (room.focal * vx) / fwd, room.centerY - (room.focal * up) / fwd, fwd];
}
