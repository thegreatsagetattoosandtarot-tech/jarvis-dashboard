// Theme & Responsive Sizing
// Returns: { T, isNarrow, isMedium, isWide, CARD_PAD, FONT_SM, leafEl }

const cw = ctx.container.clientWidth || ctx.container.offsetWidth || 600;
const leafEl = ctx.container.closest(".workspace-leaf");
const isNarrow = cw < 500;
const isMedium = cw >= 500 && cw < 800;
const isWide = (leafEl ? leafEl.clientWidth : (window.innerWidth || 0)) >= 950;

const CARD_PAD = isNarrow ? "14px 12px" : "20px 24px";
const FONT_SM = isNarrow ? "10px" : "12px";

const defaults = {
  bg:          "#020604",
  panelBg:     "#07110b",
  panelBorder: "rgba(0, 255, 102, 0.18)",
  hoverBg:     "#0b1c12",
  accent:      "#00ff66",
  accentDim:   "rgba(0, 255, 102, 0.3)",
  accentFaint: "rgba(0, 255, 102, 0.08)",
  purple:      "#65ffb0",
  green:       "#00d957",
  red:         "#ff5263",
  orange:      "#b8ff47",
  gold:        "#d7ff80",
  text:        "#d7ffe5",
  textMuted:   "#70a985",
  textDim:     "#31553d",
};

const T = Object.assign({}, defaults, ctx.config.theme || {});

return { T, isNarrow, isMedium, isWide, CARD_PAD, FONT_SM, leafEl };
