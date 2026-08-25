export interface ShapeTemplate {
  name: string;
  width: number;
  height: number;
  svgDataUrl: string;
}

function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

export const SHAPE_TEMPLATES: ShapeTemplate[] = [
  {
    name: 'Erlenmeyer Flask',
    width: 60,
    height: 80,
    svgDataUrl: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><path d="M22,10 L22,30 L6,70 A5,5 0 0,0 10,78 L50,78 A5,5 0 0,0 54,70 L38,30 L38,10 Z" fill="rgba(200,220,255,0.2)" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round"/><line x1="17" y1="10" x2="43" y2="10" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/><path d="M12,55 L48,55" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,2"/></svg>`)
  },
  {
    name: 'Beaker',
    width: 60,
    height: 80,
    svgDataUrl: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><path d="M10,20 L10,72 A5,5 0 0,0 15,77 L45,77 A5,5 0 0,0 50,72 L50,10 L56,10" fill="rgba(200,220,255,0.2)" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M10,50 L50,50" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,2"/></svg>`)
  },
  {
    name: 'Test Tube',
    width: 30,
    height: 90,
    svgDataUrl: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 90"><path d="M5,10 L5,75 A10,10 0 0,0 25,75 L25,10" fill="rgba(200,220,255,0.2)" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round"/><line x1="2" y1="10" x2="28" y2="10" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/></svg>`)
  },
  {
    name: 'Round Bottom Flask',
    width: 60,
    height: 80,
    svgDataUrl: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><path d="M22,10 L22,35 A24,24 0 1,0 38,35 L38,10 Z" fill="rgba(200,220,255,0.2)" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round"/><line x1="17" y1="10" x2="43" y2="10" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/></svg>`)
  },
  {
    name: 'Reaction Arrow',
    width: 80,
    height: 20,
    svgDataUrl: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 20"><line x1="5" y1="10" x2="75" y2="10" stroke="#1e293b" stroke-width="2.5"/><polygon points="65,4 77,10 65,16" fill="#1e293b"/></svg>`)
  },
  {
    name: 'Equilibrium Arrow',
    width: 80,
    height: 24,
    svgDataUrl: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 24"><line x1="5" y1="8" x2="75" y2="8" stroke="#1e293b" stroke-width="2"/><polygon points="65,2 77,8 65,8" fill="#1e293b"/><line x1="5" y1="16" x2="75" y2="16" stroke="#1e293b" stroke-width="2"/><polygon points="15,22 3,16 15,16" fill="#1e293b"/></svg>`)
  },
  {
    name: 'Volumetric Flask',
    width: 60,
    height: 100,
    svgDataUrl: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100"><path d="M25,10 L25,50 A20,20 0 1,0 35,50 L35,10 Z" fill="rgba(200,220,255,0.2)" stroke="#1e293b" stroke-width="2.5"/><line x1="20" y1="10" x2="40" y2="10" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/><line x1="25" y1="35" x2="35" y2="35" stroke="#1e293b" stroke-width="1.5"/></svg>`)
  },
  {
    name: 'Funnel',
    width: 60,
    height: 80,
    svgDataUrl: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><path d="M10,10 L50,10 L34,40 L34,75 L26,75 L26,40 Z" fill="rgba(200,220,255,0.2)" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round"/></svg>`)
  },
  {
    name: 'Bunsen Burner',
    width: 60,
    height: 80,
    svgDataUrl: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><path d="M15,70 L45,70 L40,30 L20,30 Z" fill="none" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round"/><path d="M25,30 L25,20 L35,20 L35,30" fill="none" stroke="#1e293b" stroke-width="2.5"/><path d="M28,20 C28,10 32,10 32,20" fill="orange" stroke="red" stroke-width="1.5"/></svg>`)
  },
  {
    name: 'Lone Pair',
    width: 30,
    height: 20,
    svgDataUrl: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><circle cx="10" cy="10" r="3" fill="#1e293b"/><circle cx="20" cy="10" r="3" fill="#1e293b"/></svg>`)
  },
  {
    name: 'Plus Sign',
    width: 40,
    height: 40,
    svgDataUrl: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><line x1="20" y1="10" x2="20" y2="30" stroke="#1e293b" stroke-width="3" stroke-linecap="round"/><line x1="10" y1="20" x2="30" y2="20" stroke="#1e293b" stroke-width="3" stroke-linecap="round"/></svg>`)
  },
  {
    name: 'Condenser',
    width: 40,
    height: 120,
    svgDataUrl: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 120"><rect x="15" y="10" width="10" height="100" fill="none" stroke="#1e293b" stroke-width="2"/><path d="M5,20 L15,20 M5,30 L15,30 M25,90 L35,90 M25,100 L35,100" stroke="#1e293b" stroke-width="2"/><rect x="8" y="20" width="24" height="80" rx="4" fill="rgba(200,220,255,0.2)" stroke="#1e293b" stroke-width="2"/></svg>`)
  },
  {
    name: 'Separatory Funnel',
    width: 60,
    height: 100,
    svgDataUrl: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100"><path d="M25,10 L35,10 L35,20 C45,20 50,30 50,45 C50,65 35,75 32,80 L32,95 L28,95 L28,80 C25,75 10,65 10,45 C10,30 15,20 25,20 Z" fill="rgba(200,220,255,0.2)" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round"/><line x1="22" y1="85" x2="38" y2="85" stroke="#1e293b" stroke-width="3"/><circle cx="30" cy="85" r="3" fill="white" stroke="#1e293b" stroke-width="1.5"/></svg>`)
  },
  {
    name: 'Dropper / Pipette',
    width: 30,
    height: 100,
    svgDataUrl: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 100"><path d="M10,20 L20,20 L20,70 L17,85 L13,85 L10,70 Z" fill="none" stroke="#1e293b" stroke-width="2" stroke-linejoin="round"/><path d="M8,10 C8,0 22,0 22,10 L22,20 L8,20 Z" fill="#64748b" stroke="#1e293b" stroke-width="2"/><circle cx="15" cy="92" r="3" fill="rgba(200,220,255,0.8)" stroke="#1e293b" stroke-width="1.5"/></svg>`)
  },
  {
    name: 'Radical (Dot)',
    width: 20,
    height: 20,
    svgDataUrl: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.5" fill="#1e293b"/></svg>`)
  },
  {
    name: 'Heat Symbol (Δ)',
    width: 40,
    height: 40,
    svgDataUrl: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><polygon points="20,8 35,32 5,32" fill="none" stroke="#1e293b" stroke-width="3" stroke-linejoin="round"/></svg>`)
  },
  {
    name: 'Light Symbol (hv)',
    width: 60,
    height: 40,
    svgDataUrl: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><text x="30" y="28" font-family="serif" font-size="24" font-style="italic" font-weight="bold" fill="#1e293b" text-anchor="middle">hν</text></svg>`)
  },
  {
    name: 'Polymer Brackets',
    width: 80,
    height: 100,
    svgDataUrl: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100"><path d="M25,10 L10,10 L10,90 L25,90" fill="none" stroke="#1e293b" stroke-width="3"/><path d="M55,10 L70,10 L70,90 L55,90" fill="none" stroke="#1e293b" stroke-width="3"/><text x="75" y="95" font-family="sans-serif" font-size="20" font-weight="bold" fill="#1e293b">n</text></svg>`)
  }
];
