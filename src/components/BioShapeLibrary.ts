export interface BioShape {
  name: string;
  type: string;
  svgDataUrl: string;
}

const encodeSVG = (svg: string) => `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

const SVG_ANTIBODY = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M50 50 L50 90" stroke="#3b82f6" stroke-width="8" stroke-linecap="round"/>
  <path d="M50 50 L20 20" stroke="#3b82f6" stroke-width="8" stroke-linecap="round"/>
  <path d="M50 50 L80 20" stroke="#3b82f6" stroke-width="8" stroke-linecap="round"/>
  <!-- Light chains -->
  <path d="M10 30 L30 10" stroke="#60a5fa" stroke-width="6" stroke-linecap="round"/>
  <path d="M90 30 L70 10" stroke="#60a5fa" stroke-width="6" stroke-linecap="round"/>
</svg>`;

const SVG_LIPID_BILAYER = `<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <g id="lipid">
      <circle cx="10" cy="10" r="6" fill="#f59e0b"/>
      <path d="M7 16 Q5 25 7 35" fill="none" stroke="#64748b" stroke-width="2"/>
      <path d="M13 16 Q15 25 13 35" fill="none" stroke="#64748b" stroke-width="2"/>
    </g>
  </defs>
  <g>
    <!-- Top layer -->
    <use href="#lipid" x="0" y="0"/>
    <use href="#lipid" x="25" y="0"/>
    <use href="#lipid" x="50" y="0"/>
    <use href="#lipid" x="75" y="0"/>
    <use href="#lipid" x="100" y="0"/>
    <use href="#lipid" x="125" y="0"/>
    <use href="#lipid" x="150" y="0"/>
    <use href="#lipid" x="175" y="0"/>
    <!-- Bottom layer (inverted) -->
    <g transform="translate(0, 60) scale(1, -1)">
      <use href="#lipid" x="0" y="0"/>
      <use href="#lipid" x="25" y="0"/>
      <use href="#lipid" x="50" y="0"/>
      <use href="#lipid" x="75" y="0"/>
      <use href="#lipid" x="100" y="0"/>
      <use href="#lipid" x="125" y="0"/>
      <use href="#lipid" x="150" y="0"/>
      <use href="#lipid" x="175" y="0"/>
    </g>
  </g>
</svg>`;

const SVG_DNA = `<svg width="100" height="200" viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg">
  <path d="M 20 20 C 80 50, 80 150, 20 180" fill="none" stroke="#ec4899" stroke-width="4" stroke-linecap="round"/>
  <path d="M 80 20 C 20 50, 20 150, 80 180" fill="none" stroke="#06b6d4" stroke-width="4" stroke-linecap="round"/>
  <!-- Base pairs -->
  <line x1="32" y1="40" x2="68" y2="40" stroke="#94a3b8" stroke-width="3"/>
  <line x1="42" y1="60" x2="58" y2="60" stroke="#94a3b8" stroke-width="3"/>
  <line x1="48" y1="100" x2="52" y2="100" stroke="#94a3b8" stroke-width="3"/>
  <line x1="42" y1="140" x2="58" y2="140" stroke="#94a3b8" stroke-width="3"/>
  <line x1="32" y1="160" x2="68" y2="160" stroke="#94a3b8" stroke-width="3"/>
</svg>`;

const SVG_RECEPTOR = `<svg width="80" height="120" viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg">
  <!-- GPCR style 7-TM -->
  <path d="M 10 10 L 10 110 M 20 110 L 20 10 M 30 10 L 30 110 M 40 110 L 40 10 M 50 10 L 50 110 M 60 110 L 60 10 M 70 10 L 70 110" fill="none" stroke="#10b981" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Connecting loops -->
  <path d="M 10 10 C 15 0, 15 0, 20 10" fill="none" stroke="#10b981" stroke-width="6"/>
  <path d="M 30 10 C 35 0, 35 0, 40 10" fill="none" stroke="#10b981" stroke-width="6"/>
  <path d="M 50 10 C 55 0, 55 0, 60 10" fill="none" stroke="#10b981" stroke-width="6"/>
  
  <path d="M 20 110 C 25 120, 25 120, 30 110" fill="none" stroke="#10b981" stroke-width="6"/>
  <path d="M 40 110 C 45 120, 45 120, 50 110" fill="none" stroke="#10b981" stroke-width="6"/>
  <path d="M 60 110 C 65 120, 65 120, 70 110" fill="none" stroke="#10b981" stroke-width="6"/>
</svg>`;

export const BIO_SHAPES: BioShape[] = [
  { name: 'Antibody', type: 'antibody', svgDataUrl: encodeSVG(SVG_ANTIBODY) },
  { name: 'Lipid Bilayer', type: 'lipid_bilayer', svgDataUrl: encodeSVG(SVG_LIPID_BILAYER) },
  { name: 'DNA Helix', type: 'dna_helix', svgDataUrl: encodeSVG(SVG_DNA) },
  { name: 'GPCR Receptor', type: 'gpcr_receptor', svgDataUrl: encodeSVG(SVG_RECEPTOR) }
];
