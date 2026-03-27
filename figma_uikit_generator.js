// Save this as a Figma Plugin (e.g. using Scripter, or Plugins > Development > New Plugin)
// This script will generate the EatPan_Fr UI Kit based on the project source code.

async function createEatPanUIKit() {
  const page = figma.createPage();
  page.name = "UI Kit (Auto-Synced from Code)";
  figma.currentPage = page;

  let currentY = 0;

  // --- 1. COLOR TOKENS ---
  const colors = [
    { name: '--parchment', hex: 'f1eacc' },
    { name: '--ink', hex: '2c1810' },
    { name: '--accent', hex: '805533' },
    { name: '--brand-red', hex: '6b0d12' },
    { name: '--surface-container', hex: 'e9dec0' },
    { name: '--outline-variant', hex: 'dec0bd' },
    { name: '--book-bg', hex: '2c1810' },
    { name: '--tab-bg', hex: 'dcc99e' }
  ];

  const colorFrame = figma.createFrame();
  colorFrame.name = "Color Tokens";
  colorFrame.layoutMode = "HORIZONTAL";
  colorFrame.itemSpacing = 24;
  colorFrame.paddingAll = 24;
  colorFrame.y = currentY;
  page.appendChild(colorFrame);

  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  colors.forEach(color => {
    const r = parseInt(color.hex.substring(0,2), 16) / 255;
    const g = parseInt(color.hex.substring(2,4), 16) / 255;
    const b = parseInt(color.hex.substring(4,6), 16) / 255;

    const swatch = figma.createRectangle();
    swatch.resize(100, 100);
    swatch.fills = [{ type: 'SOLID', color: {r, g, b} }];
    swatch.cornerRadius = 8;
    
    const label = figma.createText();
    label.characters = color.name + "\n#" + color.hex;
    label.fontSize = 12;

    const wrapper = figma.createFrame();
    wrapper.layoutMode = "VERTICAL";
    wrapper.itemSpacing = 8;
    wrapper.fills = [];
    wrapper.appendChild(swatch);
    wrapper.appendChild(label);

    colorFrame.appendChild(wrapper);
  });
  
  currentY += 200;

  // --- 2. TYPOGRAPHY ---
  // Note: Noto Serif / EB Garamond must be available in your local Figma fonts.
  // We'll use Inter as a fallback to ensure the script doesn't crash if they aren't loaded.

  const typoFrame = figma.createFrame();
  typoFrame.name = "Typography Tokens";
  typoFrame.layoutMode = "VERTICAL";
  typoFrame.itemSpacing = 24;
  typoFrame.paddingAll = 24;
  typoFrame.y = currentY;
  page.appendChild(typoFrame);

  const styles = [
    { name: ".text-h1 (Noto Serif, 44px, Black)", size: 44, weight: "Bold" },
    { name: ".text-h2 (Noto Serif, 24px, Brand Red)", size: 24, weight: "Bold" },
    { name: ".text-subtitle (EB Garamond, 14px, Italic)", size: 14, weight: "Regular" },
    { name: ".text-label (Bold, 10px, Uppercase)", size: 10, weight: "Bold" }
  ];

  styles.forEach(s => {
    const text = figma.createText();
    text.characters = s.name;
    text.fontSize = s.size;
    text.fontName = { family: "Inter", style: s.weight };
    typoFrame.appendChild(text);
  });

  currentY += typoFrame.height + 100;

  // --- 3. UI COMPONENTS (Layout representations) ---
  const compFrame = figma.createFrame();
  compFrame.name = "UI Components";
  compFrame.layoutMode = "HORIZONTAL";
  compFrame.itemSpacing = 40;
  compFrame.paddingAll = 24;
  compFrame.y = currentY;
  page.appendChild(compFrame);

  // 3.1 Button / Ribbon
  const btn = figma.createFrame();
  btn.name = "Component: btn-recipe-action";
  btn.layoutMode = "HORIZONTAL";
  btn.paddingLeft = 16; btn.paddingRight = 16;
  btn.paddingTop = 8; btn.paddingBottom = 8;
  btn.cornerRadius = 6;
  btn.fills = [{ type: 'SOLID', color: {r:0.86, g:0.79, b:0.62} }]; // tab-bg rough hex

  const btnText = figma.createText();
  btnText.characters = "ACTION BTN";
  btnText.fontSize = 12;
  btnText.fontName = { family: "Inter", style: "Bold" };
  btn.appendChild(btnText);
  compFrame.appendChild(btn);

  // 3.2 Category Card Placeholder
  const card = figma.createFrame();
  card.name = "Component: category-card";
  card.resize(150, 150);
  card.cornerRadius = 8;
  card.fills = [{ type: 'SOLID', color: {r:0.9, g:0.9, b:0.9} }];
  
  const cardPill = figma.createFrame();
  cardPill.resize(150, 40);
  cardPill.fills = [{ type: 'SOLID', color: {r:0, g:0, b:0}, opacity: 0.8 }];
  cardPill.y = 110;
  
  const cardLabel = figma.createText();
  cardLabel.characters = "CATEGORY";
  cardLabel.fills = [{ type: 'SOLID', color: {r:1, g:1, b:1} }];
  cardLabel.x = 10; cardLabel.y = 10;
  cardPill.appendChild(cardLabel);
  card.appendChild(cardPill);
  
  compFrame.appendChild(card);

  figma.viewport.scrollAndZoomIntoView([colorFrame, typoFrame, compFrame]);
  figma.closePlugin("UI Kit generated successfully!");
}

createEatPanUIKit();
