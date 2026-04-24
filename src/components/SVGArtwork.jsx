/**
 * SVGArtwork.jsx
 * Decorative SVG paths — the flowing line-art background.
 * Non-interactive. Portal rings/masks are rendered by PixiPortalLayer.
 *
 * All path data is from the original Vectornator artwork (viewBox 3840 × 2160).
 */

export default function SVGArtwork() {
  return (
    <svg
      className="line-art-layer"
      height="100%"
      strokeMiterlimit="10"
      style={{
        fillRule: 'nonzero',
        clipRule: 'evenodd',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }}
      version="1.1"
      viewBox="0 0 3840 2160"
      width="100%"
      preserveAspectRatio="none"
      xmlSpace="preserve"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs />
      <clipPath id="ArtboardFrame">
        <rect height="2160" width="3840" x="0" y="0" />
      </clipPath>

      {/* Layer 2: decorative artefacts (thick strokes at negative coords) */}
      <g clipPath="url(#ArtboardFrame)">
        <path d="M298.699-215.699C295.351-215.699 292.004-215.699 288.656-215.699" fill="#000000" fillRule="nonzero" opacity="0.28976" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="300" />
        <path d="M966.618-486.325L955.682-499.994" fill="#000000" fillRule="nonzero" opacity="0.28976" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="300" />
        <path d="M918.774-453.518C910.526-455.167 909.735-454.15 916.04-456.252" fill="#000000" fillRule="nonzero" opacity="0.28976" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="300" />
      </g>

      {/* Layer 1: main artwork curves + portal rings (children) */}
      <g clipPath="url(#ArtboardFrame)">
        {/* ── Decorative flow curves ───────────────────────────── */}
        <path d="M2916.62 579.433C3103.31 468.63 3396.01 373.122 3595.93 439.762C3842.13 521.829 3835.24 891.743 3583.66 967.215C3390.63 1025.12 3332.2 842.588 3380.39 685.965C3441.2 488.323 3684.84 330.064 3878.93 404.715" fill="none" opacity="1" stroke="#1a1a1a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6.5" />
        <path d="M1421.42 1071.43C981.632 1224.08 1076.48 2005.07 1489.2 1936.28C1885.44 1870.24 1853.21 1256.92 2243.86 1191.81C2620.81 1128.99 2346.02 1628.86 2166.81 1404.84C2094.99 1315.07 2114.28 1190.88 2177.86 1114.32M2180.71 1110.95C2239.05 1043.4 2332.64 1015.34 2427.43 1086.43C2468.03 1116.88 2498.82 1205.8 2498.82 1254.14C2498.82 1575.03 2116.18 1526.51 2000.24 1758.38C1862.3 2034.25 2002.15 2122.35 2223.29 2031.24" fill="none" opacity="1" stroke="#1a1a1a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6.5" />
        <path d="M1590.55 1006.8C1767.61 918.269 2281.42 775.364 2081.39 441.993C1935.1 198.167 1513.37 378.877 1693.09 618.496C1823.73 792.68 2093.29 457.231 1881.36 280.619C1689.53 120.766 1451.98 427.088 1543.48 610.091C1600.97 725.064 1794.81 641.779 1805.71 532.766C1819.34 396.51 1638.82 301.028 1521.63 359.625C1321.9 459.488 1290.65 848.064 1064.4 885.772C852.025 921.168 819.04 682.922 990.444 599.052" fill="none" opacity="1" stroke="#1a1a1a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6.5" />
        <path d="M561.513 1439.91C574.893 1432.95 590.095 1425.37 598.705 1421.93C646.081 1402.98 687.47 1397.88 738.502 1408.09C836.626 1427.71 957.423 1681.39 1023.63 1460.69C1051.11 1369.1 1068.94 1217.03 1034.71 1125.73C1021.15 1089.59 898.633 974.205 910.134 1066.21C937.549 1285.53 1380.21 925.761 1193.88 817.066C990.881 698.65 943.324 1065.85 1121.91 1009.46C1354.22 936.099 1428.52 596.418 1161.28 568.381" fill="none" opacity="1" stroke="#1a1a1a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6.5" />
        <path d="M999.572 548.65C990.18 368.656 1286.11 414.753 1359.67 267.626" fill="none" opacity="1" stroke="#1a1a1a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6.5" />
        <path d="M2406.54 1995.06C2601.82 1916.82 2760.81 2191.97 2922.05 1998.48C3028.36 1870.91 3010.88 1648.05 2953.05 1503.48C2942.28 1476.56 2796.31 1251.92 2777.05 1367.48C2771.83 1398.82 2806.39 1413.48 2832.05 1413.48C2986.58 1413.48 3039.16 1136.57 2879.04 1127.7" fill="none" opacity="1" stroke="#1a1a1a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6.5" />
        <path d="M387.378 1458.75C386.323 1458.36 385.409 1458.09 384.663 1457.96C282.464 1440.93 274.634 1316.88 297.377 1241.07C315.224 1181.58 695.403 812.565 547.332 775.547C497.069 762.981 447.385 807.829 411.113 833.738C79.7088 1070.46 727.686 1454.43 801.255 1123.37C864.457 838.959 353.06 645.166 292.087 401.276C247.48 222.849 372.475 10.1569 585.685 81.2272C762.563 140.186 761.754 718.644 589.653 753.065C547.444 761.506 506.791 737.208 475.917 710.744C310.378 568.854 656.22 451.971 609.491 685.616C572.165 872.243 320.386 1070.12 173.061 1168.33C143.447 1188.08-74.2495 1284.92-74.2495 1307.2" fill="none" opacity="1" stroke="#1a1a1a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6.5" />
        <path d="M2745.52 677.71C2701.51 696.326 2653.48 709.979 2610.01 729.302C2463.18 794.558 2464.38 968.523 2621.04 1027.27C2752.53 1076.58 2958.14 793.591 3061.1 965.193C3129.37 1078.99 2956.07 1244.95 2876.25 1125.21C2745.56 929.18 3134.66 913.143 3034.11 1123.91" fill="none" opacity="1" stroke="#1a1a1a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6.5" />
        <path d="M2817.38 1106.24C2814.67 1100.65 2824.58 1074.21 2826.26 1070.91C2883.9 957.208 3047.62 1021.61 3020.69 1142.97C2994.36 1261.57 2825.36 1216.16 2817.39 1108.91M2817.31 1107.75C2817.26 1107.02 2817.22 1106.28 2817.19 1105.54M2817.18 1105.2C2817.11 1103.57 2817.09 1101.92 2817.1 1100.27" fill="none" opacity="1" stroke="#1a1a1a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6.5" />

      </g>
    </svg>
  );
}
