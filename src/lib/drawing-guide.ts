// "How to draw Kuchu & Puchu" (the two kids in the Kuchu Puchu app icon: Kuchu = the boy in yellow,
// Puchu = the girl with the red bow). A plain module: the drawing page draws these shapes step by step
// (src/components/marketing/drawing-guide.tsx) and the server uses the step texts for HowTo data.
// Every step adds shapes; the last step shows them in colour. viewBox: 0 0 200 220.

export const COLORS = {
  ink: "#151923", skin: "#FCD9B6", hair: "#5B3A29", cheek: "#F9A8B8", mouth: "#E0566B",
  kuchuShirt: "#FFC93C", puchuShirt: "#FF7A8A", bow: "#F2545B", white: "#FFFFFF", new: "#FF1744",
} as const;
type ColorKey = keyof typeof COLORS;

export type Shape = {
  el: "circle" | "ellipse" | "path";
  a: Record<string, number | string>;
  step: number;          // the step that adds it
  z: number;             // drawing order (lower = behind)
  fill: ColorKey | "none"; // in the coloured picture
  line: ColorKey | "none"; // fill in the line drawing (white paper, dark eyes)
  stroke?: boolean;      // outlined (default true)
};

const head = (): Shape[] => [
  { el: "circle", a: { cx: 40, cy: 104, r: 14 }, step: 1, z: 2, fill: "skin", line: "white" },
  { el: "circle", a: { cx: 160, cy: 104, r: 14 }, step: 1, z: 2, fill: "skin", line: "white" },
  { el: "circle", a: { cx: 100, cy: 100, r: 58 }, step: 1, z: 3, fill: "skin", line: "white" },
];
const face = (step: number, smileStep: number): Shape[] => [
  { el: "path", a: { d: "M68 84 Q77 78 86 84" }, step, z: 6, fill: "none", line: "none" },
  { el: "path", a: { d: "M114 84 Q123 78 132 84" }, step, z: 6, fill: "none", line: "none" },
  { el: "ellipse", a: { cx: 78, cy: 102, rx: 8, ry: 10 }, step, z: 6, fill: "ink", line: "ink" },
  { el: "ellipse", a: { cx: 122, cy: 102, rx: 8, ry: 10 }, step, z: 6, fill: "ink", line: "ink" },
  { el: "circle", a: { cx: 81, cy: 98, r: 3 }, step, z: 7, fill: "white", line: "white", stroke: false },
  { el: "circle", a: { cx: 125, cy: 98, r: 3 }, step, z: 7, fill: "white", line: "white", stroke: false },
  { el: "ellipse", a: { cx: 63, cy: 121, rx: 9, ry: 6 }, step, z: 6, fill: "cheek", line: "white" },
  { el: "ellipse", a: { cx: 137, cy: 121, rx: 9, ry: 6 }, step, z: 6, fill: "cheek", line: "white" },
  { el: "path", a: { d: "M97 112 Q100 116 103 112" }, step: smileStep, z: 6, fill: "none", line: "none" },
  { el: "path", a: { d: "M84 124 Q100 148 116 124 Z" }, step: smileStep, z: 6, fill: "mouth", line: "white" },
];
const body = (step: number, shirt: ColorKey): Shape[] => [
  { el: "path", a: { d: "M56 216 C56 178 74 160 100 160 C126 160 144 178 144 216 Z" }, step, z: 1, fill: shirt, line: "white" },
  { el: "path", a: { d: "M86 161 Q100 172 114 161" }, step, z: 1, fill: "none", line: "none" },
];

export const KUCHU: Shape[] = [
  ...head(),
  { el: "path", a: { d: "M43 98 C39 62 60 36 90 32 L84 16 L103 28 L113 12 L120 31 C146 36 163 60 157 96 C149 79 139 71 127 68 L119 81 L109 66 L97 82 L86 66 C70 70 54 80 43 98 Z" }, step: 2, z: 5, fill: "hair", line: "white" },
  ...face(3, 4),
  ...body(5, "kuchuShirt"),
];

export const PUCHU: Shape[] = [
  { el: "path", a: { d: "M146 72 C180 74 188 120 170 152 C163 130 156 114 146 106 Z" }, step: 2, z: 0, fill: "hair", line: "white" },
  ...head(),
  { el: "path", a: { d: "M43 102 C39 58 66 36 100 36 C134 36 161 58 157 102 C150 84 140 74 128 70 C116 82 94 87 72 80 C60 86 50 93 43 102 Z" }, step: 2, z: 5, fill: "hair", line: "white" },
  { el: "path", a: { d: "M138 50 L116 36 L120 64 Z" }, step: 3, z: 8, fill: "bow", line: "white" },
  { el: "path", a: { d: "M138 50 L160 34 L158 64 Z" }, step: 3, z: 8, fill: "bow", line: "white" },
  { el: "circle", a: { cx: 138, cy: 50, r: 7 }, step: 3, z: 9, fill: "bow", line: "white" },
  ...face(4, 4),
  ...body(5, "puchuShirt"),
];

export type GuideStep = { title: string; text: string };

export const DRAWING_GUIDES: { id: string; name: string; who: string; shapes: Shape[]; steps: GuideStep[] }[] = [
  {
    id: "kuchu", name: "Kuchu", who: "the boy in the yellow T-shirt", shapes: KUCHU,
    steps: [
      { title: "Draw the head and ears", text: "Draw a big circle for Kuchu's head. Add a small half-circle on each side for the ears." },
      { title: "Add the spiky hair", text: "Draw Kuchu's messy hair on top of the head, with spikes at the top and a zig-zag fringe over the forehead." },
      { title: "Draw the eyes and cheeks", text: "Draw two big oval eyes with a tiny white circle in each, curved eyebrows above them, and a little oval on each cheek." },
      { title: "Add a big smile", text: "Draw a small curve for the nose and a wide, open smile below it." },
      { title: "Draw the body", text: "Under the head, draw a rounded T-shirt shape with a curved collar." },
      { title: "Colour Kuchu", text: "Colour the hair brown, the face light peach, the cheeks pink and the T-shirt bright yellow, just like in the Kuchu Puchu app icon." },
    ],
  },
  {
    id: "puchu", name: "Puchu", who: "the girl with the red bow", shapes: PUCHU,
    steps: [
      { title: "Draw the head and ears", text: "Draw a big circle for Puchu's head. Add a small half-circle on each side for the ears." },
      { title: "Add the hair and ponytail", text: "Draw smooth hair over the top of the head with a side fringe, and a ponytail swinging out on one side." },
      { title: "Draw the red bow", text: "On top of the hair, draw two triangle loops with a small circle in the middle for the knot." },
      { title: "Draw the face", text: "Draw two big oval eyes with a white shine, curved eyebrows, pink cheeks, a tiny nose and a happy open smile." },
      { title: "Draw the body", text: "Under the head, draw a rounded T-shirt shape with a curved collar." },
      { title: "Colour Puchu", text: "Colour the hair brown, the bow red, the face light peach, the cheeks pink and the T-shirt pink, just like in the Kuchu Puchu app icon." },
    ],
  },
];

/** SVG markup for one step (1–6) of a guide; step 6 is the coloured picture. `print` = plain outline. */
export function drawingSvg(shapes: Shape[], step: number, opts: { print?: boolean } = {}): string {
  const final = step >= 6 && !opts.print;
  const attrs = (a: Shape["a"]) => Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(" ");
  const body = [...shapes].filter(s => s.step <= step).sort((x, y) => x.z - y.z).map(s => {
    const fill = final ? s.fill : s.line;
    const isNew = !final && !opts.print && s.step === step;
    const stroke = s.stroke === false ? "none" : isNew ? COLORS.new : COLORS.ink;
    const width = s.stroke === false ? 0 : isNew ? 3.5 : 2.5;
    return `<${s.el} ${attrs(s.a)} fill="${fill === "none" ? "none" : COLORS[fill]}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join("");
  return body;
}
