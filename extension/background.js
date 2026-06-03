"use strict";
(() => {
  // src/lib/our/api.ts
  var ext = typeof browser !== "undefined" ? browser : chrome;

  // src/icon-paths.ts
  var INACTIVE = {
    16: "icons/icon-16.png",
    32: "icons/icon-32.png",
    48: "icons/icon-48.png",
    128: "icons/icon-128.png"
  };
  var ACTIVE = INACTIVE;
  var TOOLBAR_ICON_PATHS = {
    inactive: INACTIVE,
    active: ACTIVE
  };

  // src/lib/icons/lucide/files.svg
  var files_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M15 2h-4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" />\n  <path d="M16.706 2.706A2.4 2.4 0 0 0 15 2v5a1 1 0 0 0 1 1h5a2.4 2.4 0 0 0-.706-1.706z" />\n  <path d="M5 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 1.732-1" />\n</svg>\n';

  // src/lib/icons/lucide/arrow-up.svg
  var arrow_up_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="m5 12 7-7 7 7" />\n  <path d="M12 19V5" />\n</svg>\n';

  // src/lib/icons/lucide/circle-power.svg
  var circle_power_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <circle cx="12" cy="12" r="10" />\n  <path d="M12 7v4" />\n  <path d="M7.998 9.003a5 5 0 1 0 8-.005" />\n</svg>\n';

  // src/lib/icons/lucide/copy.svg
  var copy_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />\n  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />\n</svg>\n';

  // src/lib/icons/lucide/external-link.svg
  var external_link_default = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link-icon lucide-external-link">\n  <path d="M15 3h6v6" />\n  <path d="M10 14 21 3" />\n  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />\n</svg>\n';

  // src/lib/icons/lucide/file-down.svg
  var file_down_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />\n  <path d="M14 2v4a2 2 0 0 0 2 2h4" />\n  <path d="M12 18v-6" />\n  <path d="m9 15 3 3 3-3" />\n</svg>\n';

  // src/lib/icons/lucide/image-down.svg
  var image_down_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21" />\n  <path d="m14 19 3 3v-5.5" />\n  <path d="m17 22 3-3" />\n  <circle cx="9" cy="9" r="2" />\n</svg>\n';

  // src/lib/icons/lucide/images.svg
  var images_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M18 22H4a2 2 0 0 1-2-2V6" />\n  <path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18" />\n  <circle cx="12" cy="8" r="2" />\n  <rect width="16" height="16" x="6" y="2" rx="2" />\n</svg>\n';

  // src/lib/icons/lucide/heart.svg
  var heart_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />\n</svg>\n';

  // src/lib/icons/lucide/history.svg
  var history_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />\n  <path d="M3 3v5h5" />\n  <path d="M12 7v5l4 2" />\n</svg>\n';

  // src/lib/icons/lucide/cog.svg
  var cog_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M11 10.27 7 3.34" />\n  <path d="m11 13.73-4 6.93" />\n  <path d="M12 22v-2" />\n  <path d="M12 2v2" />\n  <path d="M14 12h8" />\n  <path d="m17 20.66-1-1.73" />\n  <path d="m17 3.34-1 1.73" />\n  <path d="M2 12h2" />\n  <path d="m20.66 17-1.73-1" />\n  <path d="m20.66 7-1.73 1" />\n  <path d="m3.34 17 1.73-1" />\n  <path d="m3.34 7 1.73 1" />\n  <circle cx="12" cy="12" r="2" />\n  <circle cx="12" cy="12" r="8" />\n</svg>\n';

  // src/lib/icons/lucide/info.svg
  var info_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <circle cx="12" cy="12" r="10" />\n  <path d="M12 16v-4" />\n  <path d="M12 8h.01" />\n</svg>\n';

  // src/lib/icons/lucide/keyboard.svg
  var keyboard_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M10 8h.01" />\n  <path d="M12 12h.01" />\n  <path d="M14 8h.01" />\n  <path d="M16 12h.01" />\n  <path d="M18 8h.01" />\n  <path d="M6 8h.01" />\n  <path d="M7 16h10" />\n  <path d="M8 12h.01" />\n  <rect width="20" height="16" x="2" y="4" rx="2" />\n</svg>\n';

  // src/lib/icons/lucide/pin.svg
  var pin_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M12 17v5" />\n  <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />\n</svg>\n';

  // src/lib/icons/lucide/play.svg
  var play_default = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play-icon lucide-play"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>';

  // src/lib/icons/lucide/puzzle.svg
  var puzzle_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z" />\n</svg>\n';

  // src/lib/icons/lucide/rotate-cw.svg
  var rotate_cw_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />\n  <path d="M21 3v5h-5" />\n</svg>\n';

  // src/lib/icons/lucide/settings.svg
  var settings_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />\n  <circle cx="12" cy="12" r="3" />\n</svg>\n';

  // src/lib/icons/lucide/shield-check.svg
  var shield_check_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />\n  <path d="m9 12 2 2 4-4" />\n</svg>\n';

  // src/lib/icons/brands/linkedin.svg
  var linkedin_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#000000">\n  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>\n</svg>\n';

  // src/lib/icons/index.ts
  function stripComment(svg) {
    return svg.replace(/<!--[\s\S]*?-->\s*/g, "").trim();
  }
  function lucideUiIcon(raw) {
    return stripComment(raw);
  }
  function brandIcon(raw) {
    return stripComment(raw).replace(/fill="#000000"/g, 'fill="currentColor"');
  }
  var ARROW_UP = lucideUiIcon(arrow_up_default);
  var CIRCLE_POWER = lucideUiIcon(circle_power_default);
  var COG = lucideUiIcon(cog_default);
  var COPY = lucideUiIcon(copy_default);
  var EXTERNAL_LINK = lucideUiIcon(external_link_default);
  var FILE_DOWN = lucideUiIcon(file_down_default);
  var FILES = lucideUiIcon(files_default);
  var IMAGE_DOWN = lucideUiIcon(image_down_default);
  var IMAGES = lucideUiIcon(images_default);
  var HEART = lucideUiIcon(heart_default);
  var HISTORY = lucideUiIcon(history_default);
  var INFO = lucideUiIcon(info_default);
  var KEYBOARD = lucideUiIcon(keyboard_default);
  var SETTINGS = lucideUiIcon(settings_default);
  var SHIELD_CHECK = lucideUiIcon(shield_check_default);
  var PIN = lucideUiIcon(pin_default);
  var PLAY = lucideUiIcon(play_default);
  var PUZZLE = lucideUiIcon(puzzle_default);
  var ROTATE_CW = lucideUiIcon(rotate_cw_default);
  var LINKEDIN = brandIcon(linkedin_default);

  // src/lib/icons/md2it.svg
  var md2it_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 946.295 947.014" width="24" height="24" fill="#000000">\n  <path fill-rule="evenodd" clip-rule="evenodd" d="M0.294998 230.507V461.014H57.295H114.295L114.321 317.264L114.347 173.514L119.729 182.014C131.242 200.194 138.673 212.076 147.245 226.014C152.15 233.989 159.72 246.139 164.067 253.014C168.414 259.889 177.529 274.514 184.323 285.514C197.987 307.639 211.847 329.833 216.794 337.514C218.566 340.264 223.961 348.814 228.784 356.514C241.803 377.3 252.729 393.981 253.295 393.936C253.57 393.914 256.783 389.31 260.436 383.705C264.088 378.1 274.925 361.589 284.519 347.014C294.112 332.439 306.24 313.989 311.47 306.014C316.7 298.039 328.999 279.364 338.8 264.514C348.602 249.664 364.02 226.264 373.064 212.514C382.107 198.764 391.371 184.711 393.651 181.285L397.795 175.056L398.048 318.035L398.302 461.014H455.298H512.295V230.514V0.0139999H443.011H373.726L371.839 3.264C370.8 5.052 365.368 13.939 359.766 23.014C348.231 41.703 333.55 65.582 322.265 84.014C307.818 107.609 298.029 123.527 291.826 133.514C277.383 156.769 269.295 170.081 269.295 170.6C269.295 170.904 268.002 173.035 266.422 175.334C264.842 177.633 261.224 183.452 258.383 188.264C255.542 193.077 252.898 197.008 252.506 197C252.115 196.992 250.503 194.629 248.925 191.75C245.975 186.369 222.868 148.272 218.758 142.014C217.494 140.089 209.141 126.589 200.195 112.014C166.909 57.782 163.441 52.143 153.136 35.514C147.343 26.164 140.152 14.464 137.158 9.514L131.713 0.514L66.004 0.257L0.294998 0V230.507ZM540.295 230.566V461.117L643.545 460.759C743.253 460.413 747.246 460.328 759.951 458.267C786.579 453.949 808.086 447.481 828.992 437.506C870.648 417.63 901.83 386.413 922.717 343.678C933.069 322.495 939.448 300.945 943.929 272.014C946.675 254.283 946.442 212.457 943.49 193.259C940.647 174.774 938.091 163.449 933.656 149.681C915.674 93.867 880.193 51.134 831.073 26.127C809.507 15.147 790.444 8.876 765.795 4.652C739.813 0.2 734.575 0.0139999 635.189 0.0139999H540.295V230.566ZM739.295 115.392C773.348 120.821 799.25 138.981 813.666 167.534C821.407 182.866 826.068 203.012 826.965 225.014C828.571 264.421 818.637 296.12 797.875 317.843C783.839 332.529 767.977 341.016 744.795 346.244C736.861 348.033 731.265 348.329 697.545 348.742L659.295 349.211V231.779C659.295 167.192 659.632 114.008 660.045 113.593C661.417 112.213 728.97 113.747 739.295 115.392ZM162.295 479.597C123.366 484.23 94.04 494.332 66.795 512.496C52.467 522.048 42.425 531.456 32.459 544.664C14.097 568.999 2.966 601.142 0.685997 636.416L0 647.014H57.602H115.204L115.848 643.264C119.075 624.476 127.082 609.374 139.033 599.535C151.737 589.075 168.073 583.811 187.87 583.798C205.641 583.786 220.085 588.054 232.359 596.946C241.176 603.332 248.391 615.313 250.446 626.979C253.356 643.5 244.67 663.689 228.705 677.514C225.529 680.264 210.3 692.06 194.863 703.727C179.425 715.394 164.095 727.003 160.795 729.525C157.495 732.046 143.041 742.976 128.676 753.812C99.224 776.028 70.868 797.623 45.795 816.933C36.445 824.134 22.399 834.861 14.581 840.77L0.365997 851.514L0.330997 899.264L0.294998 947.014H186.295H372.295V895.019V843.024L278.045 842.769L183.795 842.514L192.295 836.212C196.97 832.746 208.22 824.451 217.295 817.779C226.37 811.106 239.645 801.31 246.795 796.009C253.945 790.709 262.27 784.647 265.295 782.539C271.406 778.282 293.855 761.209 307.165 750.698C317.777 742.317 334.967 725.563 341.175 717.55C356.435 697.853 365.255 678.635 369.948 654.861C372.035 644.285 372.321 615.682 370.446 605.014C367.07 585.803 363.897 575.411 356.997 560.97C346.286 538.552 331.67 522.278 309.037 507.569C286.568 492.967 257.662 483.528 223.295 479.571C206.92 477.685 178.255 477.698 162.295 479.597ZM398.295 717.014V947.014H455.295H512.295V717.014V487.014H455.295H398.295V717.014ZM540.295 543.514V600.014H612.295H684.295V773.514V947.014H745.795H807.295V773.514V600.014H876.795H946.295V543.514V487.014H743.295H540.295V543.514Z"/>\n</svg>\n';

  // src/lib/our/icons.ts
  function stripComment2(svg) {
    return svg.replace(/<!--[\s\S]*?-->\s*/g, "").trim();
  }
  function inlineSvg(raw) {
    return stripComment2(raw).replace(/fill="#000000"/g, 'fill="currentColor"');
  }
  var MD2IT = inlineSvg(md2it_default);

  // src/icons.ts
  var INACTIVE_BG = "#012292";
  var ACTIVE_BG = INACTIVE_BG;
  var TOOLBAR_VIEWBOX = 24;
  var TOOLBAR_RADIUS_RATIO = 0.18;
  var TOOLBAR_PAD_RATIO = 0.1;
  function stripComment3(svg) {
    return svg.replace(/<!--[\s\S]*?-->\s*/g, "").trim();
  }
  function innerSvgMarkup(svg) {
    const match = svg.match(/<svg[\s\S]*?>([\s\S]*)<\/svg>/i);
    return match ? match[1].trim() : svg;
  }
  function svgAttr(tag, name) {
    const m = tag.match(new RegExp(`${name}="([^"]*)"`));
    return m?.[1];
  }
  function drawInnerSvg(ctx, inner) {
    ctx.fillStyle = "transparent";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const m of inner.matchAll(/<line\b[^>]*\/?>/g)) {
      const tag = m[0];
      const x1 = Number(svgAttr(tag, "x1"));
      const y1 = Number(svgAttr(tag, "y1"));
      const x2 = Number(svgAttr(tag, "x2"));
      const y2 = Number(svgAttr(tag, "y2"));
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    for (const m of inner.matchAll(/<rect\b[^>]*\/?>/g)) {
      const tag = m[0];
      const x = Number(svgAttr(tag, "x") ?? 0);
      const y = Number(svgAttr(tag, "y") ?? 0);
      const w = Number(svgAttr(tag, "width"));
      const h = Number(svgAttr(tag, "height"));
      const rx = Number(svgAttr(tag, "rx") ?? 0);
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, rx);
      ctx.stroke();
    }
    for (const m of inner.matchAll(/<path\b[^>]*\/?>/g)) {
      const d = svgAttr(m[0], "d");
      if (d) ctx.stroke(new Path2D(d));
    }
  }
  var filesInner = innerSvgMarkup(stripComment3(files_default));
  var ABOUT_BULLET_ICONS = [
    COPY,
    FILE_DOWN,
    HISTORY,
    FILES,
    IMAGES,
    FILES,
    FILES,
    SHIELD_CHECK,
    SHIELD_CHECK,
    HEART
  ];
  function drawToolbarIcon(size, bg) {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    const r = size * TOOLBAR_RADIUS_RATIO;
    const pad = size * TOOLBAR_PAD_RATIO;
    const scale = (size - pad * 2) / TOOLBAR_VIEWBOX;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, r);
    ctx.fill();
    ctx.save();
    ctx.translate(pad, pad);
    ctx.scale(scale, scale);
    drawInnerSvg(ctx, filesInner);
    ctx.restore();
    return ctx.getImageData(0, 0, size, size);
  }
  var toolbarCache = null;
  function getToolbarIconSets() {
    if (toolbarCache) return toolbarCache;
    const sizes = [16, 32, 48, 128];
    const inactive = {};
    const active = {};
    for (const size of sizes) {
      const key = String(size);
      inactive[key] = drawToolbarIcon(size, INACTIVE_BG);
      active[key] = drawToolbarIcon(size, ACTIVE_BG);
    }
    toolbarCache = { inactive, active };
    return toolbarCache;
  }
  function toolbarWelcomeIconSvg(bg = INACTIVE_BG, size = 16) {
    const r = TOOLBAR_VIEWBOX * TOOLBAR_RADIUS_RATIO;
    const pad = TOOLBAR_VIEWBOX * TOOLBAR_PAD_RATIO;
    const scale = (TOOLBAR_VIEWBOX - pad * 2) / TOOLBAR_VIEWBOX;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${TOOLBAR_VIEWBOX} ${TOOLBAR_VIEWBOX}" aria-hidden="true"><rect width="${TOOLBAR_VIEWBOX}" height="${TOOLBAR_VIEWBOX}" rx="${r}" fill="${bg}"/><g fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(${pad} ${pad}) scale(${scale})">${filesInner}</g></svg>`;
  }

  // src/lib/our/extension-icon-state/tab-active-state.ts
  var tabActive = /* @__PURE__ */ new Map();
  function getTabActiveState(tabId) {
    return tabActive.get(tabId) ?? false;
  }
  function setTabActiveState(tabId, active) {
    tabActive.set(tabId, active);
  }
  function deleteTabActiveState(tabId) {
    tabActive.delete(tabId);
  }
  function clearTabActiveState(tabId) {
    tabActive.set(tabId, false);
  }

  // src/lib/our/extension-icon-state/icon-sync.ts
  function createIconSync(config) {
    const { paths, syncedTabIdsStorageKey, logLabel, getImageSets } = config;
    let imageSetsFailed = false;
    function loadImageSets() {
      if (!getImageSets || imageSetsFailed) return null;
      try {
        return getImageSets();
      } catch (err) {
        imageSetsFailed = true;
        console.error(`[${logLabel}] dynamic toolbar icons unavailable:`, err);
        return null;
      }
    }
    function resolveToolbarIconMode(tabId) {
      return getTabActiveState(tabId) ? "active" : "inactive";
    }
    async function applyToolbarIcon(details, mode) {
      const sets = loadImageSets();
      const iconPaths = paths[mode];
      if (sets) {
        const imageData = sets[mode];
        try {
          await ext.action.setIcon({ ...details, imageData });
          return;
        } catch (err) {
          console.warn(
            `[${logLabel}] setIcon(imageData) failed, using SVG paths:`,
            err
          );
        }
      }
      try {
        await ext.action.setIcon({ ...details, path: iconPaths });
      } catch (err) {
        if (details.tabId !== void 0) {
          console.warn(`[${logLabel}] setIcon(tabId, path) failed:`, err);
          try {
            await ext.action.setIcon({ path: iconPaths });
          } catch (err2) {
            console.error(`[${logLabel}] setIcon(path) failed:`, err2);
          }
          return;
        }
        console.error(`[${logLabel}] setIcon failed:`, err);
      }
    }
    async function getIconSyncedTabIds() {
      const data = await ext.storage.session.get(syncedTabIdsStorageKey);
      const raw = data[syncedTabIdsStorageKey];
      if (!Array.isArray(raw)) return [];
      return raw.filter((id) => typeof id === "number");
    }
    async function setIconSyncedTabIds(ids) {
      await ext.storage.session.set({ [syncedTabIdsStorageKey]: ids });
    }
    async function rememberIconSyncedTab(tabId) {
      const ids = await getIconSyncedTabIds();
      if (ids.includes(tabId)) return;
      await setIconSyncedTabIds([...ids, tabId]);
    }
    async function forgetIconSyncedTab2(tabId) {
      const ids = await getIconSyncedTabIds();
      if (!ids.includes(tabId)) return;
      await setIconSyncedTabIds(ids.filter((id) => id !== tabId));
    }
    async function syncIconForTab2(tabId) {
      await applyToolbarIcon({ tabId }, resolveToolbarIconMode(tabId));
      await rememberIconSyncedTab(tabId);
    }
    async function setGlobalToolbarIcon2() {
      await applyToolbarIcon({}, "inactive");
    }
    async function syncAllTabIcons() {
      const tabIds = await getIconSyncedTabIds();
      const alive = [];
      for (const tabId of tabIds) {
        try {
          await applyToolbarIcon({ tabId }, resolveToolbarIconMode(tabId));
          alive.push(tabId);
        } catch {
        }
      }
      if (alive.length !== tabIds.length) {
        await setIconSyncedTabIds(alive);
      }
    }
    async function bootstrapToolbarIcons2() {
      await setGlobalToolbarIcon2();
      await syncAllTabIcons();
    }
    return {
      syncIconForTab: syncIconForTab2,
      forgetIconSyncedTab: forgetIconSyncedTab2,
      setGlobalToolbarIcon: setGlobalToolbarIcon2,
      bootstrapToolbarIcons: bootstrapToolbarIcons2
    };
  }

  // src/lib/our/extension-icon-state/listeners.ts
  function registerExtensionIconStateListeners(sync) {
    ext.tabs.onRemoved.addListener((tabId) => {
      deleteTabActiveState(tabId);
      void sync.forgetIconSyncedTab(tabId);
    });
    ext.tabs.onActivated.addListener(({ tabId }) => {
      void sync.syncIconForTab(tabId);
    });
    ext.tabs.onUpdated.addListener((tabId, changeInfo) => {
      if (changeInfo.status === "loading" || changeInfo.url !== void 0) {
        clearTabActiveState(tabId);
      }
      if (changeInfo.url === void 0 && changeInfo.status !== "complete") {
        return;
      }
      void sync.syncIconForTab(tabId);
    });
  }
  function onContentActiveChanged(sync, tabId, active) {
    setTabActiveState(tabId, active);
    void sync.syncIconForTab(tabId);
  }

  // src/lib/our/extension-icon-state/create.ts
  function createExtensionIconState(config) {
    const sync = createIconSync(config);
    return {
      bootstrapToolbarIcons: sync.bootstrapToolbarIcons,
      forgetIconSyncedTab: sync.forgetIconSyncedTab,
      setGlobalToolbarIcon: sync.setGlobalToolbarIcon,
      syncIconForTab: sync.syncIconForTab,
      registerExtensionIconStateListeners: () => registerExtensionIconStateListeners(sync),
      onContentActiveChanged: (tabId, active) => {
        onContentActiveChanged(sync, tabId, active);
      }
    };
  }

  // src/extension-icon-state/constants.ts
  var ICON_SYNCED_TAB_IDS_KEY = "iconSyncedTabIds";
  var ICON_STATE_LOG_LABEL = "Element Copier";

  // src/extension-icon-state/index.ts
  var iconState = createExtensionIconState({
    paths: TOOLBAR_ICON_PATHS,
    syncedTabIdsStorageKey: ICON_SYNCED_TAB_IDS_KEY,
    logLabel: ICON_STATE_LOG_LABEL,
    getImageSets: getToolbarIconSets
  });
  var {
    bootstrapToolbarIcons,
    forgetIconSyncedTab,
    onContentActiveChanged: onContentActiveChanged2,
    registerExtensionIconStateListeners: registerExtensionIconStateListeners2,
    setGlobalToolbarIcon,
    syncIconForTab
  } = iconState;

  // src/lib/our/hotkeys/prefix-hint-messages.ts
  var PREFIX_HINT_SHOW = "PREFIX_HINT_SHOW";
  var PREFIX_HINT_HIDE = "PREFIX_HINT_HIDE";
  var PREFIX_HINT_CAN_SHOW = "PREFIX_HINT_CAN_SHOW";
  var PREFIX_HINT_BLOCKED = "PREFIX_HINT_BLOCKED";
  function isPrefixHintShowMessage(msg) {
    return msg.type === PREFIX_HINT_SHOW;
  }
  function isPrefixHintHideMessage(msg) {
    return msg.type === PREFIX_HINT_HIDE;
  }

  // src/lib/our/hotkeys/prefix-hint-badge.ts
  var PREFIX_BADGE_BACKGROUND_COLOR = "#012292";
  var PREFIX_BADGE_TEXT_COLOR = "#ffffff";
  async function showPrefixBadge(letter, tabId, backgroundColor = PREFIX_BADGE_BACKGROUND_COLOR, textColor = PREFIX_BADGE_TEXT_COLOR) {
    const text = letter.toUpperCase().slice(0, 4);
    const tabDetails = tabId !== void 0 ? { tabId } : {};
    try {
      await ext.action.setBadgeBackgroundColor({
        ...tabDetails,
        color: backgroundColor
      });
      const setBadgeTextColor = ext.action.setBadgeTextColor;
      await setBadgeTextColor?.({ ...tabDetails, color: textColor });
      await ext.action.setBadgeText({ ...tabDetails, text });
    } catch (err) {
      console.warn("[prefix-hint] setBadgeText failed:", err);
    }
  }
  async function hidePrefixBadge(tabId) {
    const tabDetails = tabId !== void 0 ? { tabId } : {};
    try {
      await ext.action.setBadgeText({ ...tabDetails, text: "" });
    } catch (err) {
      console.warn("[prefix-hint] clear badge failed:", err);
    }
  }
  var badgeListenersRegistered = false;
  var badgeBackgroundColor = PREFIX_BADGE_BACKGROUND_COLOR;
  var badgeTextColor = PREFIX_BADGE_TEXT_COLOR;
  var canShowPrefixBadgeOnTab;
  var onShowCallbacks = [];
  var onHideCallbacks = [];
  function registerPrefixHintBadgeListeners(options = {}) {
    if (options.badgeBackgroundColor !== void 0) {
      badgeBackgroundColor = options.badgeBackgroundColor;
    }
    if (options.badgeTextColor !== void 0) {
      badgeTextColor = options.badgeTextColor;
    }
    if (options.canShowPrefixBadgeOnTab !== void 0) {
      canShowPrefixBadgeOnTab = options.canShowPrefixBadgeOnTab;
    }
    if (options.onShow) onShowCallbacks.push(options.onShow);
    if (options.onHide) onHideCallbacks.push(options.onHide);
    if (badgeListenersRegistered) return;
    badgeListenersRegistered = true;
    ext.runtime.onMessage.addListener((message, sender) => {
      const tabId = sender.tab?.id;
      if (isPrefixHintShowMessage(message)) {
        void (async () => {
          if (tabId !== void 0 && canShowPrefixBadgeOnTab) {
            if (!await canShowPrefixBadgeOnTab(tabId)) return;
          }
          for (const cb of onShowCallbacks) cb(tabId, message.letter);
          await showPrefixBadge(message.letter, tabId, badgeBackgroundColor, badgeTextColor);
        })();
        return;
      }
      if (isPrefixHintHideMessage(message)) {
        void (async () => {
          await hidePrefixBadge(tabId);
          for (const cb of onHideCallbacks) cb(tabId);
        })();
      }
    });
  }

  // src/lib/our/hotkeys/prefix-background.ts
  var EXECUTE_ACTION_COMMAND = "_execute_action";
  function registerPrefixBackgroundHotkeys(config) {
    registerPrefixHintBadgeListeners({
      badgeBackgroundColor: config.badgeBackgroundColor
    });
    ext.commands.onCommand.addListener((command) => {
      if (command === EXECUTE_ACTION_COMMAND) {
        config.suppress.stampToggleCommand();
        void (async () => {
          const tab = await config.getActiveCommandTab();
          if (tab?.id === void 0) return;
          if (!await config.isToggleEnabled()) return;
          await config.onToggleRequest(tab.id, tab.windowId);
        })();
        return;
      }
      if (!config.undoCommand || command !== config.undoCommand) {
        return;
      }
      void (async () => {
        const tab = await config.getActiveCommandTab();
        if (tab?.id === void 0) return;
        if (config.isUndoCommandEnabled && !await config.isUndoCommandEnabled(tab)) {
          return;
        }
        await config.onUndoCommand?.(tab);
      })();
    });
    ext.runtime.onMessage.addListener((message, sender) => {
      const msg = message;
      if (msg.type !== config.toggleRequestMessageType || sender.tab?.id === void 0) {
        return;
      }
      const tabId = sender.tab.id;
      void (async () => {
        if (!await config.isToggleEnabled()) return;
        await config.onToggleRequest(tabId, sender.tab?.windowId);
      })();
    });
  }

  // src/lib/our/page-operability/probe.ts
  function probeDocumentOperability() {
    try {
      const root = document.documentElement ?? document.body;
      if (!root) return false;
      const probe = document.createElement("div");
      probe.style.display = "none";
      root.appendChild(probe);
      const ok = probe.isConnected;
      probe.remove();
      return ok;
    } catch {
      return false;
    }
  }

  // src/lib/our/hotkeys/prefix-operability.ts
  var operabilityListenersRegistered = false;
  function registerPrefixHintOperabilityListeners(handlers) {
    if (operabilityListenersRegistered) return;
    operabilityListenersRegistered = true;
    ext.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const tabId = sender.tab?.id;
      if (tabId === void 0) return;
      const msg = message;
      if (msg.type === PREFIX_HINT_CAN_SHOW) {
        void handlers.canOperateOnTab(tabId).then((ok) => {
          sendResponse(ok);
        });
        return true;
      }
      if (msg.type === PREFIX_HINT_BLOCKED) {
        void handlers.onBlockedOnTab?.(tabId, sender.tab?.windowId);
      }
    });
  }

  // src/lib/our/hotkeys/suppress.ts
  var DEFAULT_TOGGLE_COMMAND_SUPPRESS_MS = 300;
  function shouldSuppressContentToggleAfterToggleCommand(lastAt, now, windowMs = DEFAULT_TOGGLE_COMMAND_SUPPRESS_MS) {
    return lastAt > 0 && now - lastAt < windowMs;
  }
  function createToggleCommandSuppressTracker(windowMs = DEFAULT_TOGGLE_COMMAND_SUPPRESS_MS) {
    let lastToggleCommandAt = 0;
    return {
      stampToggleCommand: () => {
        lastToggleCommandAt = Date.now();
      },
      shouldSuppressContentToggle: (now = Date.now()) => shouldSuppressContentToggleAfterToggleCommand(
        lastToggleCommandAt,
        now,
        windowMs
      ),
      shouldSuppressToolbarClick: (now = Date.now()) => shouldSuppressContentToggleAfterToggleCommand(
        lastToggleCommandAt,
        now,
        windowMs
      )
    };
  }

  // src/lib/our/hotkeys/settings.ts
  function readBooleanSetting(data, key) {
    const raw = data[key];
    return raw !== false;
  }

  // src/brand.ts
  var COPIER_ACTIVE_COLOR = "#012292";
  var PANEL_TITLE = "ELEMENT COPIER";

  // src/messages.ts
  var STORAGE_KEY = "notificationSeconds";
  var LOCALE_STORAGE_KEY = "locale";
  var LOCALE_USER_SELECTED_KEY = "localeUserSelected";
  var LOCALE_DETECT_VERSION_KEY = "localeDetectVersion";
  var LOCALE_DETECT_VERSION = 1;
  var START_HOTKEY_ENABLED_KEY = "startHotkeyEnabled";
  var DEFAULT_NOTIFICATION_SECONDS = 4;

  // src/hotkeys/settings.ts
  async function getStartHotkeyEnabled() {
    const data = await ext.storage.local.get(START_HOTKEY_ENABLED_KEY);
    return readBooleanSetting(data, START_HOTKEY_ENABLED_KEY);
  }

  // src/hotkeys/background.ts
  var toggleCommandSuppress = createToggleCommandSuppressTracker();
  function shouldSuppressToolbarClickAfterHotkeyCommand(now = Date.now()) {
    return toggleCommandSuppress.shouldSuppressToolbarClick(now);
  }
  function registerBackgroundHotkeys(host) {
    registerPrefixBackgroundHotkeys({
      badgeBackgroundColor: COPIER_ACTIVE_COLOR,
      getActiveCommandTab: host.getActiveCommandTab,
      isToggleEnabled: getStartHotkeyEnabled,
      toggleRequestMessageType: "TOGGLE_REQUEST",
      onToggleRequest: (tabId, windowId) => host.toggleTab(tabId, windowId, void 0, "hotkey"),
      suppress: toggleCommandSuppress
    });
  }

  // src/page-operability/constants.ts
  var RESTRICTED_NOTICE_POPUP = "blocked-notice.html";
  var RESTRICTED_NOTICE_MIN_MS = 4e3;
  var RESTRICTED_NOTICE_SESSION_KEY = "restrictedNotice";
  var RESTRICTED_NOTICE_CONFIG = {
    popupHtml: RESTRICTED_NOTICE_POPUP,
    sessionKey: RESTRICTED_NOTICE_SESSION_KEY,
    logLabel: "Element Copier"
  };

  // src/lib/our/page-operability/content-probe.ts
  var PROBE_DOCUMENT_OPERABILITY = "PROBE_DOCUMENT_OPERABILITY";

  // src/lib/our/page-operability/can-operate.ts
  function scriptingTarget(tabId, frameId) {
    return frameId !== void 0 && frameId !== 0 ? { tabId, frameIds: [frameId] } : { tabId };
  }
  function messageOptions(frameId) {
    return frameId !== void 0 && frameId !== 0 ? { frameId } : void 0;
  }
  async function canOperateOnTab(tabId, frameId) {
    try {
      const options = messageOptions(frameId);
      const response = options === void 0 ? await ext.tabs.sendMessage(tabId, { type: PROBE_DOCUMENT_OPERABILITY }) : await ext.tabs.sendMessage(
        tabId,
        { type: PROBE_DOCUMENT_OPERABILITY },
        options
      );
      if (response === true) return true;
      if (response === false) return false;
    } catch {
    }
    try {
      const [result] = await ext.scripting.executeScript({
        target: scriptingTarget(tabId, frameId),
        func: probeDocumentOperability
      });
      return result?.result === true;
    } catch {
      return false;
    }
  }

  // src/lib/our/page-operability/show-notice.ts
  async function showBlockedNotice(tabId, config, payload, windowId) {
    const { popupHtml, sessionKey, logLabel } = config;
    void ext.storage.session.set({
      [sessionKey]: { ...payload, tabId }
    });
    const noticeUrl = ext.runtime.getURL(popupHtml);
    let winId = windowId;
    if (winId === void 0) {
      try {
        const tab = await ext.tabs.get(tabId);
        winId = tab.windowId;
      } catch {
      }
    }
    try {
      await ext.action.setPopup({ tabId, popup: popupHtml });
      const openPopup = ext.action.openPopup;
      if (openPopup && winId !== void 0) {
        await openPopup({ windowId: winId });
        return;
      }
      throw new Error("action.openPopup unavailable");
    } catch (err) {
      console.warn(`[${logLabel}] openPopup notice failed, using tab:`, err);
      try {
        await ext.tabs.create({
          url: `${noticeUrl}?mode=tab`,
          active: true
        });
      } catch (err2) {
        console.error(`[${logLabel}] blocked notice tab failed:`, err2);
      }
    } finally {
      await ext.action.setPopup({ tabId, popup: "" });
    }
  }

  // src/lib/our/page-operability/messages.ts
  var BLOCKED_NOTICE_DISMISSED = "BLOCKED_NOTICE_DISMISSED";
  function isBlockedNoticeDismissedMessage(message) {
    if (typeof message !== "object" || message === null) return false;
    const m = message;
    return m.type === BLOCKED_NOTICE_DISMISSED && typeof m.tabId === "number";
  }

  // src/lib/our/i18n/detect.ts
  function getAcceptLanguageTags() {
    return new Promise((resolve) => {
      const getAccept = ext.i18n?.getAcceptLanguages;
      if (typeof getAccept !== "function") {
        resolve(fallbackLanguageTags());
        return;
      }
      try {
        const maybePromise = getAccept((languages) => {
          resolve(pickLanguageTags(languages));
        });
        if (maybePromise && typeof maybePromise.then === "function") {
          void maybePromise.then((languages) => resolve(pickLanguageTags(languages))).catch(() => resolve(fallbackLanguageTags()));
        }
      } catch {
        resolve(fallbackLanguageTags());
      }
    });
  }
  function pickLanguageTags(languages) {
    if (languages?.length) return [...languages];
    return fallbackLanguageTags();
  }
  function fallbackLanguageTags() {
    if (typeof navigator !== "undefined" && navigator.languages?.length) {
      return [...navigator.languages];
    }
    try {
      const ui = ext.i18n?.getUILanguage?.();
      return ui ? [ui] : [];
    } catch {
      return [];
    }
  }
  async function detectLocale(mapLanguageTag2, fallbackLocale) {
    const tags = await getAcceptLanguageTags();
    const seen = /* @__PURE__ */ new Set();
    for (const tag of tags) {
      const key = tag.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const mapped = mapLanguageTag2(tag);
      if (mapped) return mapped;
    }
    return fallbackLocale;
  }

  // src/i18n/detect.ts
  function mapLanguageTag(tag) {
    const base = tag.trim().toLowerCase().replace(/_/g, "-").split("-")[0];
    if (base === "en") return "en";
    return null;
  }
  function detectLocale2() {
    return detectLocale(mapLanguageTag, "en");
  }

  // src/lib/our/i18n/rtl.ts
  var RTL_LOCALES = /* @__PURE__ */ new Set(["ar"]);
  function isRtlLocale(locale) {
    return RTL_LOCALES.has(locale);
  }

  // src/i18n/locales/ar.ts
  var AR_MESSAGES = {
    restrictedPageNotice: "لا تعمل إضافات المتصفح على صفحات النظام والمواقع المحمية. جرّب موقعًا آخر.",
    panelSubtitle: "إضافة المتصفح",
    titleSettings: "البدء",
    pickElementButtonLabel: "اختيار عنصر",
    capturePageButtonLabel: "لقطة الصفحة",
    settingsDefaultActionLabel: "الإجراء الافتراضي",
    settingsDefaultActionNothing: "لا شيء",
    settingsDefaultActionCopyText: "نسخ النص",
    settingsDefaultActionCopyMarkdown: "نسخ Markdown",
    settingsDefaultActionCopyImage: "نسخ الصورة",
    settingsDefaultActionDownloadMarkdown: "تنزيل Markdown",
    settingsDefaultActionDownloadHtml: "تنزيل HTML",
    settingsDefaultActionDownloadPng: "تنزيل PNG",
    settingsDefaultActionDownloadJpeg: "تنزيل JPEG",
    settingsDefaultActionCopyCode: "نسخ الكود",
    settingsDefaultActionCopySelector: "نسخ المُحدِّد",
    settingsDefaultActionCopyJsPath: "نسخ JS path",
    settingsDefaultActionCopyXPath: "نسخ XPath",
    settingsDefaultActionCopyFullXPath: "نسخ XPath الكامل",
    settingsDefaultActionCopyStyles: "نسخ الأنماط",
    settingsDefaultActionCopyComputedStyles: "نسخ computed",
    settingsCopyDefaultNothing: "لا شيء",
    settingsInlineImagesLabel: "الصور المضمّنة في النص",
    settingsInlineImagesUseAll: "الإبقاء على الكل",
    settingsInlineImagesRemoveLarge: "إزالة الكبيرة",
    settingsInlineImagesRemoveSmall: "إزالة الصغيرة",
    settingsInlineImagesRemoveAll: "إزالة الكل",
    settingsInlineImagesInfoLabel: "عن الصور المضمّنة",
    settingsInlineImagesInfo: "تضمّن بعض الصفحات الصور في HTML كـ Base64 (شائع في Google ومواقع مشابهة). قد يبطئ ذلك النسخ ويكبّر مخرجات النص أو Markdown. الصور الصغيرة غالبًا أيقونات أو أزرار تزيد الفوضى. اضبط ما يُضمَّن من هنا.",
    settingsFrameLabelStyleLabel: "على الإطار",
    settingsFrameLabelNone: "بدون عنوان",
    settingsFrameLabelClickToCopy: "انقر للنسخ",
    settingsFrameLabelTagIdClass: "tag id class",
    settingsFrameLabelSelector: "مُحدِّد",
    settingsFrameLabelFullXPath: "XPath الكامل",
    infoWindowCloseLabel: "إغلاق",
    settingsComputeImagesLabel: "إنشاء الصور",
    settingsComputeImagesInfoLabel: "حول إنشاء الصور",
    settingsComputeImagesInfo: "في الصفحات الكبيرة، يستغرق إنشاء الصور وقتًا طويلاً. إذا لم تكن بحاجة إليها، أوقفها لتعمل أسرع بكثير.",
    settingsDeveloperToolsToggleLabel: "عرض أدوات المطوّر",
    settingsDarkThemeToggleLabel: "المظهر الداكن",
    copiedFormatTurnedOffInSettings: "مُعطّل في الإعدادات",
    copiedFormatNothingInCache: "لا يوجد شيء لهذا التنسيق",
    formatCode: "كود",
    formatSelector: "مُحدِّد",
    formatJsPath: "JS path",
    formatComputedStyles: "computed",
    formatStyles: "الأنماط",
    formatXPath: "XPath",
    formatFullXPath: "XPath الكامل",
    formatText: "نص",
    formatMarkdown: "Markdown",
    formatHtml: "HTML",
    formatPng: "PNG",
    formatJpeg: "JPEG",
    formatImage: "صورة",
    formatUrl: "URL",
    tabCopied: "منسوخ",
    copiedTitle: "تم النسخ!",
    loadingDataProcessing: "معالجة البيانات",
    copiedSubtitlePrefix: "نُسخ إلى الحافظة:",
    copiedSubtitleDownloadPrefix: "تم التنزيل:",
    copiedFormatsGroupLabel: "خيارات:",
    copiedFilesLabel: "تنزيل",
    copiedCopyLabel: "نسخ",
    copiedOpenUrlIconLabel: "فتح URL في تبويب جديد",
    copiedImageClipboardUnsupportedTooltip: "لا يستطيع متصفحك نسخ هذا التنسيق إلى الحافظة. استخدم «تنزيل» بدلًا من ذلك.",
    copiedEmptyLine1: "لم يُحفظ شيء بعد.",
    copiedEmptyLine2: "هل ننسخ شيئًا؟",
    pageSettingsTitle: "الإعدادات",
    tabShortcuts: "الاختصارات",
    shortcutsRunStopHeading: "تشغيل / إيقاف الإضافة:",
    shortcutsStepPress: "اضغط:",
    shortcutsStepOnMac: "على Mac:",
    shortcutsStepRelease: "ارفع أصابعك عن المفاتيح",
    shortcutsStepThenPress: "ثم اضغط",
    shortcutsStopHeading: "للإيقاف:",
    shortcutsSafetyLine1: "اختصار الخطوات الثلاث غير بديهي.",
    shortcutsSafetyLine2: "لكنه أكثر أمانًا وأقل تعارضًا مع التطبيقات الأخرى.",
    shortcutsWholePageBefore: "نفس الخطوات، لكن اضغط ",
    shortcutsWholePageAfter: " مرتين لالتقاط الصفحة كاملة فورًا.",
    tabAbout: "حول",
    welcomePin: "لإبقاء الإضافة في متناول اليد:",
    welcomePinStep1: "في الشريط العلوي افتح قائمة الإضافات",
    welcomePinStep2: "في القائمة ابحث عن:",
    welcomePinStep3: "انقر زر التثبيت:",
    aboutBullets: [
      "النسخ إلى الحافظة",
      "التنزيل",
      "يحفظ اللقطات الأخيرة",
      "النصوص: منسّقة، عادية، markdown، HTML",
      "صور: PNG، JPEG",
      "مُحدِّدات الكود: مُحدِّد، JS path، XPath، XPath الكامل",
      "أنماط الكود: المعلنة، المحسوبة",
      "بلا شبكة",
      "بلا جمع بيانات",
      "شكر وتقدير (MIT): Lucide, Modern-Screenshot, Turndown"
    ],
    aboutProductName: "Element-Copier",
    aboutCreditAuthor: "Alex T"
  };

  // src/i18n/locales/de.ts
  var DE_MESSAGES = {
    restrictedPageNotice: "Browser-Erweiterungen funktionieren nicht auf Systemseiten und geschützten Websites. Versuche es auf einer anderen Seite.",
    panelSubtitle: "Browser-Erweiterung",
    titleSettings: "START",
    pickElementButtonLabel: "ELEMENT WÄHLEN",
    capturePageButtonLabel: "SEITE AUFNEHMEN",
    settingsDefaultActionLabel: "Standardaktion",
    settingsDefaultActionNothing: "NICHTS",
    settingsDefaultActionCopyText: "Text kopieren",
    settingsDefaultActionCopyMarkdown: "Markdown kopieren",
    settingsDefaultActionCopyImage: "Bild kopieren",
    settingsDefaultActionDownloadMarkdown: "Markdown herunterladen",
    settingsDefaultActionDownloadHtml: "HTML herunterladen",
    settingsDefaultActionDownloadPng: "PNG herunterladen",
    settingsDefaultActionDownloadJpeg: "JPEG herunterladen",
    settingsDefaultActionCopyCode: "Code kopieren",
    settingsDefaultActionCopySelector: "Selektor kopieren",
    settingsDefaultActionCopyJsPath: "JS-Pfad kopieren",
    settingsDefaultActionCopyXPath: "XPath kopieren",
    settingsDefaultActionCopyFullXPath: "Vollständigen XPath kopieren",
    settingsDefaultActionCopyStyles: "Stile kopieren",
    settingsDefaultActionCopyComputedStyles: "Computed kopieren",
    settingsCopyDefaultNothing: "nichts",
    settingsInlineImagesLabel: "Eingebettete Bilder im Text",
    settingsInlineImagesUseAll: "Alle behalten",
    settingsInlineImagesRemoveLarge: "Große entfernen",
    settingsInlineImagesRemoveSmall: "Kleine entfernen",
    settingsInlineImagesRemoveAll: "Alle entfernen",
    settingsInlineImagesInfoLabel: "Zu eingebetteten Bildern",
    settingsInlineImagesInfo: "Einige Seiten betten Bilder im HTML als Base64 ein (häufig bei Google und ähnlichen Seiten). Das kann das Kopieren verlangsamen und Text- oder Markdown-Ausgaben aufblähen. Kleine Bilder sind oft Symbole oder Schaltflächen, die stören. Steuere hier, was eingeschlossen wird.",
    settingsFrameLabelStyleLabel: "Am Rahmen",
    settingsFrameLabelNone: "Kein Titel",
    settingsFrameLabelClickToCopy: "klicken zum Kopieren",
    settingsFrameLabelTagIdClass: "tag id class",
    settingsFrameLabelSelector: "Selektor",
    settingsFrameLabelFullXPath: "vollständiger XPath",
    infoWindowCloseLabel: "Schließen",
    settingsComputeImagesLabel: "Bilder generieren",
    settingsComputeImagesInfoLabel: "Zur Bildgenerierung",
    settingsComputeImagesInfo: "Auf großen Seiten dauert die Bildgenerierung sehr lange. Wenn Sie sie nicht brauchen, schalten Sie sie aus — so läuft alles deutlich schneller.",
    settingsDeveloperToolsToggleLabel: "Entwicklertools anzeigen",
    settingsDarkThemeToggleLabel: "Dunkles Design",
    copiedFormatTurnedOffInSettings: "In den Einstellungen ausgeschaltet",
    copiedFormatNothingInCache: "Nichts für dieses Format",
    formatCode: "Code",
    formatSelector: "Selektor",
    formatJsPath: "JS-Pfad",
    formatComputedStyles: "computed",
    formatStyles: "Stile",
    formatXPath: "XPath",
    formatFullXPath: "vollständiger XPath",
    formatText: "Text",
    formatMarkdown: "Markdown",
    formatHtml: "HTML",
    formatPng: "PNG",
    formatJpeg: "JPEG",
    formatImage: "Bild",
    formatUrl: "URL",
    tabCopied: "KOPIERT",
    copiedTitle: "Kopiert!",
    loadingDataProcessing: "Daten werden verarbeitet",
    copiedSubtitlePrefix: "In die Zwischenablage kopiert:",
    copiedSubtitleDownloadPrefix: "Heruntergeladen:",
    copiedFormatsGroupLabel: "Optionen:",
    copiedFilesLabel: "Herunterladen",
    copiedCopyLabel: "Kopieren",
    copiedOpenUrlIconLabel: "URL in neuem Tab öffnen",
    copiedImageClipboardUnsupportedTooltip: "Dein Browser kann dieses Bildformat nicht in die Zwischenablage kopieren. Nutze stattdessen Herunterladen.",
    copiedEmptyLine1: "Noch nichts gespeichert.",
    copiedEmptyLine2: "Sollen wir etwas kopieren?",
    pageSettingsTitle: "EINSTELLUNGEN",
    tabShortcuts: "TASTENKÜRZEL",
    shortcutsRunStopHeading: "Erweiterung starten / beenden:",
    shortcutsStepPress: "Drücke:",
    shortcutsStepOnMac: "Auf dem Mac:",
    shortcutsStepRelease: "Tasten loslassen",
    shortcutsStepThenPress: "Dann drücke",
    shortcutsStopHeading: "Beenden:",
    shortcutsSafetyLine1: "Die 3-stufige Tastenkombination ist nicht offensichtlich.",
    shortcutsSafetyLine2: "Sie ist aber sicherer und vermeidet Konflikte mit anderen Apps.",
    shortcutsWholePageBefore: "Gleiche Schritte, aber ",
    shortcutsWholePageAfter: " zweimal drücken, um sofort die ganze Seite zu erfassen.",
    tabAbout: "ÜBER",
    welcomePin: "Erweiterung griffbereit halten:",
    welcomePinStep1: "In der oberen Leiste findest du die Erweiterungsliste",
    welcomePinStep2: "Suche in der Liste:",
    welcomePinStep3: "Klicke auf die Anheften-Schaltfläche:",
    aboutBullets: [
      "In die Zwischenablage kopieren",
      "Herunterladen",
      "Merkt sich letzte Aufnahmen",
      "Texte: formatiert, einfach, Markdown, HTML",
      "Bilder: PNG, JPEG",
      "Code-Selektoren: Selektor, JS-Pfad, XPath, vollständiger XPath",
      "Code-Stile: deklariert, berechnet",
      "Nutzt kein Netzwerk",
      "Keine Datenerfassung",
      "Danksagung (MIT): Lucide, Modern-Screenshot, Turndown"
    ],
    aboutProductName: "Element-Copier",
    aboutCreditAuthor: "Alex T"
  };

  // src/i18n/locales/es.ts
  var ES_MESSAGES = {
    restrictedPageNotice: "Las extensiones no funcionan en páginas del sistema ni en sitios protegidos. Prueba en otro sitio.",
    panelSubtitle: "extensión de navegador",
    titleSettings: "INICIO",
    pickElementButtonLabel: "ELEGIR ELEMENTO",
    capturePageButtonLabel: "CAPTURA DE PÁGINA",
    settingsDefaultActionLabel: "Acción predeterminada",
    settingsDefaultActionNothing: "NADA",
    settingsDefaultActionCopyText: "Copiar texto",
    settingsDefaultActionCopyMarkdown: "Copiar Markdown",
    settingsDefaultActionCopyImage: "Copiar imagen",
    settingsDefaultActionDownloadMarkdown: "Descargar Markdown",
    settingsDefaultActionDownloadHtml: "Descargar HTML",
    settingsDefaultActionDownloadPng: "Descargar PNG",
    settingsDefaultActionDownloadJpeg: "Descargar JPEG",
    settingsDefaultActionCopyCode: "Copiar código",
    settingsDefaultActionCopySelector: "Copiar selector",
    settingsDefaultActionCopyJsPath: "Copiar ruta JS",
    settingsDefaultActionCopyXPath: "Copiar XPath",
    settingsDefaultActionCopyFullXPath: "Copiar XPath completo",
    settingsDefaultActionCopyStyles: "Copiar estilos",
    settingsDefaultActionCopyComputedStyles: "Copiar computed",
    settingsCopyDefaultNothing: "nada",
    settingsInlineImagesLabel: "Imágenes incrustadas en el texto",
    settingsInlineImagesUseAll: "Usar todas",
    settingsInlineImagesRemoveLarge: "Quitar grandes",
    settingsInlineImagesRemoveSmall: "Quitar pequeñas",
    settingsInlineImagesRemoveAll: "Quitar todas",
    settingsInlineImagesInfoLabel: "Sobre imágenes incrustadas",
    settingsInlineImagesInfo: "Algunas páginas incrustan imágenes en el HTML como Base64 (habitual en Google y sitios similares). Esto puede ralentizar la copia e inflar la salida en texto o Markdown. Las imágenes pequeñas suelen ser iconos o botones que añaden ruido. Usa este ajuste para controlar qué se incluye.",
    settingsFrameLabelStyleLabel: "En el marco",
    settingsFrameLabelNone: "Sin título",
    settingsFrameLabelClickToCopy: "clic para copiar",
    settingsFrameLabelTagIdClass: "tag id class",
    settingsFrameLabelSelector: "selector",
    settingsFrameLabelFullXPath: "XPath completo",
    infoWindowCloseLabel: "Cerrar",
    settingsComputeImagesLabel: "Generar imágenes",
    settingsComputeImagesInfoLabel: "Sobre la generación de imágenes",
    settingsComputeImagesInfo: "En páginas grandes, generar imágenes lleva mucho tiempo. Si no las necesitas, desactívalas para ir mucho más rápido.",
    settingsDeveloperToolsToggleLabel: "Mostrar herramientas para desarrolladores",
    settingsDarkThemeToggleLabel: "Tema oscuro",
    copiedFormatTurnedOffInSettings: "Desactivado en la configuración",
    copiedFormatNothingInCache: "Nada para este formato",
    formatCode: "código",
    formatSelector: "selector",
    formatJsPath: "Ruta JS",
    formatComputedStyles: "computed",
    formatStyles: "estilos",
    formatXPath: "XPath",
    formatFullXPath: "XPath completo",
    formatText: "Texto",
    formatMarkdown: "Markdown",
    formatHtml: "HTML",
    formatPng: "PNG",
    formatJpeg: "JPEG",
    formatImage: "Imagen",
    formatUrl: "URL",
    tabCopied: "COPIADO",
    copiedTitle: "¡Copiado!",
    loadingDataProcessing: "Procesando datos",
    copiedSubtitlePrefix: "Copiado al portapapeles:",
    copiedSubtitleDownloadPrefix: "Descargado:",
    copiedFormatsGroupLabel: "Opciones:",
    copiedFilesLabel: "Descargar",
    copiedCopyLabel: "Copiar",
    copiedOpenUrlIconLabel: "Abrir URL en una pestaña nueva",
    copiedImageClipboardUnsupportedTooltip: "Tu navegador no puede copiar este formato de imagen al portapapeles. Usa Descargar.",
    copiedEmptyLine1: "No hay nada guardado todavía.",
    copiedEmptyLine2: "¿Copiamos algo?",
    pageSettingsTitle: "AJUSTES",
    tabShortcuts: "ATAJOS",
    shortcutsRunStopHeading: "Para iniciar / detener la extensión:",
    shortcutsStepPress: "Pulsa:",
    shortcutsStepOnMac: "En Mac:",
    shortcutsStepRelease: "Suelta las teclas",
    shortcutsStepThenPress: "Luego pulsa",
    shortcutsStopHeading: "Para detener:",
    shortcutsSafetyLine1: "El atajo de 3 pasos no es obvio.",
    shortcutsSafetyLine2: "Pero es más seguro y evita conflictos con otras apps.",
    shortcutsWholePageBefore: "Los mismos pasos, pero pulsa ",
    shortcutsWholePageAfter: " dos veces para capturar toda la página al instante.",
    tabAbout: "ACERCA DE",
    welcomePin: "Para tener la extensión siempre a mano:",
    welcomePinStep1: "En la barra superior hay una lista de extensiones",
    welcomePinStep2: "En la lista, busca:",
    welcomePinStep3: "Pulsa el botón de anclar:",
    aboutBullets: [
      "Copiar al portapapeles",
      "Descargar",
      "Recuerda capturas recientes",
      "Textos: con formato, plano, markdown, HTML",
      "Imágenes: PNG, JPEG",
      "Selectores de código: selector, ruta JS, XPath, XPath completo",
      "Estilos de código: declarados, calculados",
      "No usa la red",
      "No recopila datos",
      "Créditos (MIT): Lucide, Modern-Screenshot, Turndown"
    ],
    aboutProductName: "Element-Copier",
    aboutCreditAuthor: "Alex T"
  };

  // src/i18n/locales/fr.ts
  var FR_MESSAGES = {
    restrictedPageNotice: "Les extensions ne fonctionnent pas sur les pages système ni les sites protégés. Essayez un autre site.",
    panelSubtitle: "extension de navigateur",
    titleSettings: "DÉMARRER",
    pickElementButtonLabel: "CHOISIR L'ÉLÉMENT",
    capturePageButtonLabel: "CAPTURE DE PAGE",
    settingsDefaultActionLabel: "Action par défaut",
    settingsDefaultActionNothing: "RIEN",
    settingsDefaultActionCopyText: "Copier le texte",
    settingsDefaultActionCopyMarkdown: "Copier Markdown",
    settingsDefaultActionCopyImage: "Copier l'image",
    settingsDefaultActionDownloadMarkdown: "Télécharger Markdown",
    settingsDefaultActionDownloadHtml: "Télécharger HTML",
    settingsDefaultActionDownloadPng: "Télécharger PNG",
    settingsDefaultActionDownloadJpeg: "Télécharger JPEG",
    settingsDefaultActionCopyCode: "Copier le code",
    settingsDefaultActionCopySelector: "Copier le sélecteur",
    settingsDefaultActionCopyJsPath: "Copier le chemin JS",
    settingsDefaultActionCopyXPath: "Copier XPath",
    settingsDefaultActionCopyFullXPath: "Copier le XPath complet",
    settingsDefaultActionCopyStyles: "Copier les styles",
    settingsDefaultActionCopyComputedStyles: "Copier computed",
    settingsCopyDefaultNothing: "rien",
    settingsInlineImagesLabel: "Images intégrées au texte",
    settingsInlineImagesUseAll: "Tout garder",
    settingsInlineImagesRemoveLarge: "Retirer les grandes",
    settingsInlineImagesRemoveSmall: "Retirer les petites",
    settingsInlineImagesRemoveAll: "Tout retirer",
    settingsInlineImagesInfoLabel: "À propos des images intégrées",
    settingsInlineImagesInfo: "Certaines pages intègrent des images dans le HTML en Base64 (fréquent sur Google et sites similaires). Cela peut ralentir la copie et alourdir le texte ou le Markdown. Les petites images sont souvent des icônes ou boutons superflus. Utilisez ce réglage pour choisir ce qui est inclus.",
    settingsFrameLabelStyleLabel: "Sur le cadre",
    settingsFrameLabelNone: "Sans titre",
    settingsFrameLabelClickToCopy: "cliquer pour copier",
    settingsFrameLabelTagIdClass: "tag id class",
    settingsFrameLabelSelector: "sélecteur",
    settingsFrameLabelFullXPath: "XPath complet",
    infoWindowCloseLabel: "Fermer",
    settingsComputeImagesLabel: "Générer les images",
    settingsComputeImagesInfoLabel: "À propos de la génération d'images",
    settingsComputeImagesInfo: "Sur les grandes pages, la génération d'images prend beaucoup de temps. Si vous n'en avez pas besoin, désactivez-les pour aller beaucoup plus vite.",
    settingsDeveloperToolsToggleLabel: "Afficher les outils de développement",
    settingsDarkThemeToggleLabel: "Thème sombre",
    copiedFormatTurnedOffInSettings: "Désactivé dans les paramètres",
    copiedFormatNothingInCache: "Rien pour ce format",
    formatCode: "code",
    formatSelector: "sélecteur",
    formatJsPath: "Chemin JS",
    formatComputedStyles: "computed",
    formatStyles: "styles",
    formatXPath: "XPath",
    formatFullXPath: "XPath complet",
    formatText: "Texte",
    formatMarkdown: "Markdown",
    formatHtml: "HTML",
    formatPng: "PNG",
    formatJpeg: "JPEG",
    formatImage: "Image",
    formatUrl: "URL",
    tabCopied: "COPIÉ",
    copiedTitle: "Copié !",
    loadingDataProcessing: "Traitement des données",
    copiedSubtitlePrefix: "Copié dans le presse-papiers :",
    copiedSubtitleDownloadPrefix: "Téléchargé :",
    copiedFormatsGroupLabel: "Options :",
    copiedFilesLabel: "Télécharger",
    copiedCopyLabel: "Copier",
    copiedOpenUrlIconLabel: "Ouvrir l'URL dans un nouvel onglet",
    copiedImageClipboardUnsupportedTooltip: "Votre navigateur ne peut pas copier ce format d'image dans le presse-papiers. Utilisez Télécharger.",
    copiedEmptyLine1: "Rien n'est encore enregistré.",
    copiedEmptyLine2: "On copie quelque chose ?",
    pageSettingsTitle: "PARAMÈTRES",
    tabShortcuts: "RACCOURCIS",
    shortcutsRunStopHeading: "Pour démarrer / arrêter l'extension :",
    shortcutsStepPress: "Appuyez sur :",
    shortcutsStepOnMac: "Sur Mac :",
    shortcutsStepRelease: "Relâchez les touches",
    shortcutsStepThenPress: "Puis appuyez sur",
    shortcutsStopHeading: "Pour arrêter :",
    shortcutsSafetyLine1: "Le raccourci en 3 étapes n'est pas évident.",
    shortcutsSafetyLine2: "Mais il est plus sûr et évite les conflits avec d'autres apps.",
    shortcutsWholePageBefore: "Mêmes étapes, mais appuyez sur ",
    shortcutsWholePageAfter: " deux fois pour capturer toute la page immédiatement.",
    tabAbout: "À PROPOS",
    welcomePin: "Pour garder l'extension à portée de main :",
    welcomePinStep1: "La barre supérieure affiche la liste des extensions",
    welcomePinStep2: "Dans la liste, trouvez :",
    welcomePinStep3: "Cliquez sur le bouton d'épinglage :",
    aboutBullets: [
      "Copier dans le presse-papiers",
      "Télécharger",
      "Mémorise les captures récentes",
      "Textes : formaté, brut, markdown, HTML",
      "Images : PNG, JPEG",
      "Sélecteurs de code : sélecteur, chemin JS, XPath, XPath complet",
      "Styles de code : déclarés, calculés",
      "N'utilise pas le réseau",
      "Ne collecte pas de données",
      "Crédits (MIT) : Lucide, Modern-Screenshot, Turndown"
    ],
    aboutProductName: "Element-Copier",
    aboutCreditAuthor: "Alex T"
  };

  // src/i18n/locales/ru.ts
  var RU_MESSAGES = {
    restrictedPageNotice: "Расширения не работают на системных страницах и защищённых сайтах. Откройте другой сайт.",
    panelSubtitle: "расширение для браузера",
    titleSettings: "СТАРТ",
    pickElementButtonLabel: "ВЫБРАТЬ ЭЛЕМЕНТ",
    capturePageButtonLabel: "СКРИНШОТ СТРАНИЦЫ",
    settingsDefaultActionLabel: "Действие по умолчанию",
    settingsDefaultActionNothing: "НИЧЕГО",
    settingsDefaultActionCopyText: "Копировать текст",
    settingsDefaultActionCopyMarkdown: "Копировать Markdown",
    settingsDefaultActionCopyImage: "Копировать изображение",
    settingsDefaultActionDownloadMarkdown: "Скачать Markdown",
    settingsDefaultActionDownloadHtml: "Скачать HTML",
    settingsDefaultActionDownloadPng: "Скачать PNG",
    settingsDefaultActionDownloadJpeg: "Скачать JPEG",
    settingsDefaultActionCopyCode: "Копировать код",
    settingsDefaultActionCopySelector: "Копировать селектор",
    settingsDefaultActionCopyJsPath: "Копировать JS-путь",
    settingsDefaultActionCopyXPath: "Копировать XPath",
    settingsDefaultActionCopyFullXPath: "Копировать полный XPath",
    settingsDefaultActionCopyStyles: "Копировать стили",
    settingsDefaultActionCopyComputedStyles: "Копировать computed",
    settingsCopyDefaultNothing: "ничего",
    settingsInlineImagesLabel: "Встроенные изображения в тексте",
    settingsInlineImagesUseAll: "Оставить все",
    settingsInlineImagesRemoveLarge: "Убрать крупные",
    settingsInlineImagesRemoveSmall: "Убрать мелкие",
    settingsInlineImagesRemoveAll: "Убрать все",
    settingsInlineImagesInfoLabel: "О встроенных изображениях",
    settingsInlineImagesInfo: "Некоторые страницы встраивают изображения в HTML как Base64 (часто у Google и похожих сайтов). Это может замедлить копирование и увеличить результат в текстовом формате или Markdown. Мелкие изображения часто бывают иконками или кнопками и добавляют шум. Здесь можно выбрать, что включать.",
    settingsFrameLabelStyleLabel: "На рамке",
    settingsFrameLabelNone: "Без подписи",
    settingsFrameLabelClickToCopy: "нажмите, чтобы скопировать",
    settingsFrameLabelTagIdClass: "tag id class",
    settingsFrameLabelSelector: "селектор",
    settingsFrameLabelFullXPath: "полный XPath",
    infoWindowCloseLabel: "Закрыть",
    settingsComputeImagesLabel: "Генерировать изображения",
    settingsComputeImagesInfoLabel: "О генерации изображений",
    settingsComputeImagesInfo: "На больших страницах генерация изображений занимает много времени. Если они не нужны, то отключите, так будет работать намного быстрее.",
    settingsDeveloperToolsToggleLabel: "Показывать инструменты разработчика",
    settingsDarkThemeToggleLabel: "Тёмная тема",
    copiedFormatTurnedOffInSettings: "Выключено в настройках",
    copiedFormatNothingInCache: "Нет данных для этого формата",
    formatCode: "код",
    formatSelector: "селектор",
    formatJsPath: "JS-путь",
    formatComputedStyles: "computed",
    formatStyles: "стили",
    formatXPath: "XPath",
    formatFullXPath: "полный XPath",
    formatText: "Текст",
    formatMarkdown: "Markdown",
    formatHtml: "HTML",
    formatPng: "PNG",
    formatJpeg: "JPEG",
    formatImage: "Картинка",
    formatUrl: "URL",
    tabCopied: "СКОПИРОВАНО",
    copiedTitle: "Скопировано!",
    loadingDataProcessing: "Обработка данных",
    copiedSubtitlePrefix: "Скопировано в буфер обмена:",
    copiedSubtitleDownloadPrefix: "Скачано:",
    copiedFormatsGroupLabel: "Варианты:",
    copiedFilesLabel: "Скачать",
    copiedCopyLabel: "Копировать",
    copiedOpenUrlIconLabel: "Открыть URL в новой вкладке",
    copiedImageClipboardUnsupportedTooltip: "Браузер не может скопировать этот формат изображения в буфер обмена. Используйте «Скачать».",
    copiedEmptyLine1: "Пока ничего не сохранено.",
    copiedEmptyLine2: "Скопировать что-нибудь?",
    pageSettingsTitle: "НАСТРОЙКИ",
    tabShortcuts: "ГОРЯЧИЕ КЛАВИШИ",
    shortcutsRunStopHeading: "Запуск и остановка расширения:",
    shortcutsStepPress: "Нажмите:",
    shortcutsStepOnMac: "На Mac:",
    shortcutsStepRelease: "Отпустите клавиши",
    shortcutsStepThenPress: "Затем нажмите",
    shortcutsStopHeading: "Остановка:",
    shortcutsSafetyLine1: "Трёхшаговые горячие клавиши неочевидны.",
    shortcutsSafetyLine2: "Но оно безопаснее и реже конфликтует с другими приложениями.",
    shortcutsWholePageBefore: "Те же шаги, но нажмите ",
    shortcutsWholePageAfter: " дважды, чтобы сразу снять всю страницу.",
    tabAbout: "О ПРОГРАММЕ",
    welcomePin: "Чтобы расширение было под рукой:",
    welcomePinStep1: "На верхней панели откройте список расширений",
    welcomePinStep2: "В списке найдите:",
    welcomePinStep3: "Нажмите кнопку закрепления:",
    aboutBullets: [
      "Копирование в буфер обмена",
      "Скачивание",
      "Запоминает недавние снимки",
      "Текст: формат., обычный, markdown, HTML",
      "Изображения: PNG, JPEG",
      "Селекторы кода: селектор, JS-путь, XPath, полный XPath",
      "Стили кода: объявленные, вычисленные",
      "Не использует сеть",
      "Без сбора данных",
      "Благодарности (MIT): Lucide, Modern-Screenshot, Turndown"
    ],
    aboutProductName: "Element-Copier",
    aboutCreditAuthor: "Alex T"
  };

  // src/i18n/locales/zh_CN.ts
  var ZH_CN_MESSAGES = {
    restrictedPageNotice: "浏览器扩展无法在系统页面和受保护网站上使用。请换一个网站试试。",
    panelSubtitle: "浏览器扩展",
    titleSettings: "开始",
    pickElementButtonLabel: "选择元素",
    capturePageButtonLabel: "页面截图",
    settingsDefaultActionLabel: "默认操作",
    settingsDefaultActionNothing: "无",
    settingsDefaultActionCopyText: "复制文本",
    settingsDefaultActionCopyMarkdown: "复制 Markdown",
    settingsDefaultActionCopyImage: "复制图片",
    settingsDefaultActionDownloadMarkdown: "下载 Markdown",
    settingsDefaultActionDownloadHtml: "下载 HTML",
    settingsDefaultActionDownloadPng: "下载 PNG",
    settingsDefaultActionDownloadJpeg: "下载 JPEG",
    settingsDefaultActionCopyCode: "复制代码",
    settingsDefaultActionCopySelector: "复制选择器",
    settingsDefaultActionCopyJsPath: "复制 JS 路径",
    settingsDefaultActionCopyXPath: "复制 XPath",
    settingsDefaultActionCopyFullXPath: "复制完整 XPath",
    settingsDefaultActionCopyStyles: "复制样式",
    settingsDefaultActionCopyComputedStyles: "复制计算样式",
    settingsCopyDefaultNothing: "无",
    settingsInlineImagesLabel: "文本中的内嵌图片",
    settingsInlineImagesUseAll: "全部保留",
    settingsInlineImagesRemoveLarge: "移除大图",
    settingsInlineImagesRemoveSmall: "移除小图",
    settingsInlineImagesRemoveAll: "全部移除",
    settingsInlineImagesInfoLabel: "关于内嵌图片",
    settingsInlineImagesInfo: "部分页面在 HTML 中以 Base64 嵌入图片（Google 等网站较常见）。这会拖慢复制并撑大文本或 Markdown 输出。小图多为图标或按钮，易造成干扰。可用此设置控制包含范围。",
    settingsFrameLabelStyleLabel: "框上显示",
    settingsFrameLabelNone: "无标题",
    settingsFrameLabelClickToCopy: "点击复制",
    settingsFrameLabelTagIdClass: "tag id class",
    settingsFrameLabelSelector: "选择器",
    settingsFrameLabelFullXPath: "完整 XPath",
    infoWindowCloseLabel: "关闭",
    settingsComputeImagesLabel: "生成图片",
    settingsComputeImagesInfoLabel: "关于生成图片",
    settingsComputeImagesInfo: "在大型页面上，生成图片需要很长时间。如果不需要，请关闭，运行会快很多。",
    settingsDeveloperToolsToggleLabel: "显示开发者工具",
    settingsDarkThemeToggleLabel: "深色主题",
    copiedFormatTurnedOffInSettings: "已在设置中关闭",
    copiedFormatNothingInCache: "此格式无可用内容",
    formatCode: "代码",
    formatSelector: "选择器",
    formatJsPath: "JS 路径",
    formatComputedStyles: "计算样式",
    formatStyles: "样式",
    formatXPath: "XPath",
    formatFullXPath: "完整 XPath",
    formatText: "文本",
    formatMarkdown: "Markdown",
    formatHtml: "HTML",
    formatPng: "PNG",
    formatJpeg: "JPEG",
    formatImage: "图片",
    formatUrl: "URL",
    tabCopied: "已复制",
    copiedTitle: "已复制！",
    loadingDataProcessing: "正在处理",
    copiedSubtitlePrefix: "已复制到剪贴板：",
    copiedSubtitleDownloadPrefix: "已下载：",
    copiedFormatsGroupLabel: "选项：",
    copiedFilesLabel: "下载",
    copiedCopyLabel: "复制",
    copiedOpenUrlIconLabel: "在新标签页打开 URL",
    copiedImageClipboardUnsupportedTooltip: "浏览器无法将此图片格式复制到剪贴板。请改用「下载」。",
    copiedEmptyLine1: "还没有保存任何内容。",
    copiedEmptyLine2: "要复制一些内容吗？",
    pageSettingsTitle: "设置",
    tabShortcuts: "快捷键",
    shortcutsRunStopHeading: "启动 / 停止扩展：",
    shortcutsStepPress: "按下：",
    shortcutsStepOnMac: "在 Mac 上：",
    shortcutsStepRelease: "松开按键",
    shortcutsStepThenPress: "然后按",
    shortcutsStopHeading: "停止：",
    shortcutsSafetyLine1: "三步快捷键不够直观。",
    shortcutsSafetyLine2: "但更安全，也更少与其他应用冲突。",
    shortcutsWholePageBefore: "步骤相同，但连按两次 ",
    shortcutsWholePageAfter: " 可立即截取整页。",
    tabAbout: "关于",
    welcomePin: "让扩展始终触手可及：",
    welcomePinStep1: "在顶部工具栏打开扩展列表",
    welcomePinStep2: "在列表中找到：",
    welcomePinStep3: "点击固定按钮：",
    aboutBullets: [
      "复制到剪贴板",
      "下载",
      "记住最近的快照",
      "文本：带格式、纯文本、markdown、HTML",
      "图片：PNG、JPEG",
      "代码选择器：选择器、JS 路径、XPath、完整 XPath",
      "代码样式：声明、计算",
      "不使用网络",
      "不收集数据",
      "致谢 (MIT): Lucide, Modern-Screenshot, Turndown"
    ],
    aboutProductName: "Element-Copier",
    aboutCreditAuthor: "Alex T"
  };

  // src/i18n/strings.ts
  var EN_MESSAGES = {
    restrictedPageNotice: "Browser extensions don't work on system pages and protected sites. Try another site.",
    panelSubtitle: "browser extension",
    titleSettings: "START",
    pickElementButtonLabel: "PICK ELEMENT",
    capturePageButtonLabel: "SCREENSHOT PAGE",
    settingsDefaultActionLabel: "Default action",
    settingsDefaultActionNothing: "NOTHING",
    settingsDefaultActionCopyText: "Copy Text",
    settingsDefaultActionCopyMarkdown: "Copy Markdown",
    settingsDefaultActionCopyImage: "Copy Image",
    settingsDefaultActionDownloadMarkdown: "Download Markdown",
    settingsDefaultActionDownloadHtml: "Download HTML",
    settingsDefaultActionDownloadPng: "Download PNG",
    settingsDefaultActionDownloadJpeg: "Download JPEG",
    settingsDefaultActionCopyCode: "Copy code",
    settingsDefaultActionCopySelector: "Copy selector",
    settingsDefaultActionCopyJsPath: "Copy JS path",
    settingsDefaultActionCopyXPath: "Copy XPath",
    settingsDefaultActionCopyFullXPath: "Copy full XPath",
    settingsDefaultActionCopyStyles: "Copy styles",
    settingsDefaultActionCopyComputedStyles: "Copy computed styles",
    settingsCopyDefaultNothing: "nothing",
    settingsInlineImagesLabel: "Inline images in text",
    settingsInlineImagesUseAll: "Use all",
    settingsInlineImagesRemoveLarge: "Remove large",
    settingsInlineImagesRemoveSmall: "Remove small",
    settingsInlineImagesRemoveAll: "Remove all",
    settingsInlineImagesInfoLabel: "About inline images",
    settingsInlineImagesInfo: "Some pages embed images in the HTML as Base64 (common on Google and similar sites). This can slow copying and bloat Text or Markdown output. Small images are often icons or buttons that add clutter. Use this setting to control what is included.",
    settingsFrameLabelStyleLabel: "On the frame",
    settingsFrameLabelNone: "No title",
    settingsFrameLabelClickToCopy: "click to copy",
    settingsFrameLabelTagIdClass: "tag id class",
    settingsFrameLabelSelector: "selector",
    settingsFrameLabelFullXPath: "full XPath",
    infoWindowCloseLabel: "Close",
    settingsComputeImagesLabel: "Generate images",
    settingsComputeImagesInfoLabel: "About generating images",
    settingsComputeImagesInfo: "On large pages, images take a lot of time to generate. If you don't need them, turn them off to run way faster.",
    settingsDeveloperToolsToggleLabel: "Display developer tools",
    settingsDarkThemeToggleLabel: "Dark theme",
    copiedFormatTurnedOffInSettings: "Turned off in the settings",
    copiedFormatNothingInCache: "Nothing for this format",
    formatCode: "code",
    formatSelector: "selector",
    formatJsPath: "JS path",
    formatComputedStyles: "computed styles",
    formatStyles: "styles",
    formatXPath: "XPath",
    formatFullXPath: "full XPath",
    formatText: "Text",
    formatMarkdown: "Markdown",
    formatHtml: "HTML",
    formatPng: "PNG",
    formatJpeg: "JPEG",
    formatImage: "Image",
    formatUrl: "URL",
    tabCopied: "COPIED",
    copiedTitle: "Copied!",
    loadingDataProcessing: "Data processing",
    copiedSubtitlePrefix: "Copied to clipboard:",
    copiedSubtitleDownloadPrefix: "Downloaded:",
    copiedFormatsGroupLabel: "Options:",
    copiedFilesLabel: "Download",
    copiedCopyLabel: "Copy",
    copiedOpenUrlIconLabel: "Open URL in a new tab",
    copiedImageClipboardUnsupportedTooltip: "Your browser can't copy this image format to the clipboard. Use Download instead.",
    copiedEmptyLine1: "I don't have anything saved in my memory.",
    copiedEmptyLine2: "Should we copy something?",
    pageSettingsTitle: "SETTINGS",
    tabShortcuts: "SHORTCUTS",
    shortcutsRunStopHeading: "To run / stop the extension:",
    shortcutsStepPress: "Press:",
    shortcutsStepOnMac: "On Mac:",
    shortcutsStepRelease: "Release the keys",
    shortcutsStepThenPress: "Then press",
    shortcutsStopHeading: "To stop:",
    shortcutsSafetyLine1: "The 3-step shortcut is not obvious.",
    shortcutsSafetyLine2: "But it is safer and avoids conflicts with other apps.",
    shortcutsWholePageBefore: "Do the steps above, but tap ",
    shortcutsWholePageAfter: " twice to capture the whole page immediately.",
    tabAbout: "ABOUT",
    welcomePin: "To keep the extension handy:",
    welcomePinStep1: "The top bar has an extensions list",
    welcomePinStep2: "In the list, find:",
    welcomePinStep3: "Click the pin button:",
    aboutBullets: [
      "Copy to clipboard",
      "Download",
      "Remembers recent snapshots",
      "Texts: formatted, plain, markdown, HTML",
      "Images: PNG, JPEG",
      "Code selectors: selector, JS path, XPath, full XPath",
      "Code styles: declared, computed",
      "Doesn't use the network",
      "Doesn't collect data",
      "Credits (MIT): Lucide, Modern-Screenshot, Turndown"
    ],
    aboutProductName: "Element-Copier",
    aboutCreditAuthor: "Alex T"
  };
  var LOCALE_MESSAGES = {
    ar: AR_MESSAGES,
    de: DE_MESSAGES,
    es: ES_MESSAGES,
    fr: FR_MESSAGES,
    ru: RU_MESSAGES,
    zh_CN: ZH_CN_MESSAGES
  };
  function t(locale) {
    return LOCALE_MESSAGES[locale] ?? EN_MESSAGES;
  }

  // src/i18n/types.ts
  var LOCALES = [
    "en",
    "es",
    "fr",
    "de",
    "ru",
    "zh_CN",
    "ar"
  ];
  var LOCALE_BUTTON_LABELS = {
    en: "EN",
    es: "ES",
    fr: "FR",
    de: "DE",
    ru: "RU",
    zh_CN: "中文",
    ar: "عربي"
  };
  function isLocale(value) {
    return typeof value === "string" && LOCALES.includes(value);
  }

  // src/lib/our/i18n/locale-code.ts
  var CHINESE_UI_LOCALE = "zh_CN";
  function normalizeLocaleCode(code) {
    if (code === "zh") return CHINESE_UI_LOCALE;
    return code;
  }

  // src/storage.ts
  async function getNotificationSeconds() {
    const data = await ext.storage.local.get(STORAGE_KEY);
    const raw = data[STORAGE_KEY];
    if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 0 || raw > 10) {
      return DEFAULT_NOTIFICATION_SECONDS;
    }
    return raw;
  }
  async function getLocale() {
    const data = await ext.storage.local.get(LOCALE_STORAGE_KEY);
    const raw = data[LOCALE_STORAGE_KEY];
    if (typeof raw === "string") {
      const normalized = normalizeLocaleCode(raw);
      if (isLocale(normalized)) {
        if (normalized !== raw) {
          await ext.storage.local.set({ [LOCALE_STORAGE_KEY]: normalized });
        }
        return normalized;
      }
    }
    return detectLocale2();
  }
  async function ensureLocaleInStorage() {
    const data = await ext.storage.local.get([
      LOCALE_STORAGE_KEY,
      LOCALE_USER_SELECTED_KEY,
      LOCALE_DETECT_VERSION_KEY
    ]);
    if (data[LOCALE_USER_SELECTED_KEY] && isLocale(data[LOCALE_STORAGE_KEY])) {
      return;
    }
    const version = data[LOCALE_DETECT_VERSION_KEY];
    if (version === LOCALE_DETECT_VERSION && isLocale(data[LOCALE_STORAGE_KEY])) {
      return;
    }
    const detected = await detectLocale2();
    await ext.storage.local.set({
      [LOCALE_STORAGE_KEY]: detected,
      [LOCALE_DETECT_VERSION_KEY]: LOCALE_DETECT_VERSION
    });
  }

  // src/page-operability/notice.ts
  var restrictedNoticeCache = null;
  async function restrictedNoticeDismissMs() {
    const seconds = await getNotificationSeconds();
    if (seconds <= 0) return RESTRICTED_NOTICE_MIN_MS;
    return seconds * 1e3;
  }
  async function getRestrictedNoticeDismissMs() {
    return restrictedNoticeDismissMs();
  }
  async function refreshRestrictedNoticeCache() {
    const [locale, dismissMs] = await Promise.all([
      getLocale(),
      restrictedNoticeDismissMs()
    ]);
    restrictedNoticeCache = { text: t(locale).restrictedPageNotice, dismissMs };
  }
  async function showRestrictedNotice(tabId, windowId) {
    if (!restrictedNoticeCache) {
      await refreshRestrictedNoticeCache();
    }
    await showBlockedNotice(
      tabId,
      RESTRICTED_NOTICE_CONFIG,
      restrictedNoticeCache,
      windowId
    );
  }

  // src/lib/our/badge/text-color-animation.ts
  function toHex(value) {
    return value.toString(16).padStart(2, "0");
  }
  function mixColor(from, to, ratio) {
    const normalizedRatio = Math.max(0, Math.min(1, ratio));
    const r = Math.round(from[0] + (to[0] - from[0]) * normalizedRatio);
    const g = Math.round(from[1] + (to[1] - from[1]) * normalizedRatio);
    const b = Math.round(from[2] + (to[2] - from[2]) * normalizedRatio);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  function normalizeFrame(frame, totalFrames) {
    return (frame % totalFrames + totalFrames) % totalFrames;
  }
  function resolveStep(frame, steps, mode) {
    const totalFrames = mode === "ping-pong" ? steps * 2 : steps;
    const normalizedFrame = normalizeFrame(frame, totalFrames);
    if (mode === "loop") return normalizedFrame + 1;
    if (normalizedFrame < steps) return normalizedFrame + 1;
    return totalFrames - normalizedFrame;
  }
  function createBadgeTextColorAnimation(options) {
    const steps = Math.max(2, Math.floor(options.steps));
    const mode = options.mode ?? "ping-pong";
    const totalFrames = mode === "ping-pong" ? steps * 2 : steps;
    const hasMidColor = "midColor" in options;
    const midStep = hasMidColor ? Math.min(steps - 1, Math.max(1, Math.floor(steps / 2))) : 1;
    const firstSpan = Math.max(1, midStep - 1);
    const secondSpan = Math.max(1, steps - midStep);
    return {
      totalFrames,
      stepIntervalMs: Math.max(1, Math.floor(options.stepIntervalMs)),
      nextFrame: (frame) => (normalizeFrame(frame, totalFrames) + 1) % totalFrames,
      getColor: (frame) => {
        const step = resolveStep(frame, steps, mode);
        if (!hasMidColor) {
          const ratio2 = (step - 1) / Math.max(1, steps - 1);
          return mixColor(options.startColor, options.endColor, ratio2);
        }
        if (step <= midStep) {
          const ratio2 = (step - 1) / firstSpan;
          return mixColor(options.startColor, options.midColor, ratio2);
        }
        const ratio = (step - midStep) / secondSpan;
        return mixColor(options.midColor, options.endColor, ratio);
      }
    };
  }

  // src/background-badge.ts
  var BADGE_TEXT_COLOR = "#ffffff";
  var BADGE_PREFIX_BACKGROUND_COLOR = "#ffffff";
  var BADGE_PREFIX_TEXT_COLOR = COPIER_ACTIVE_COLOR;
  var BADGE_SELECTION_BACKGROUND_COLOR = COPIER_ACTIVE_COLOR;
  var BADGE_COPIED_BACKGROUND_COLOR = "#008000";
  var BADGE_BLOCKED_BACKGROUND_COLOR = "#d3d3d3";
  var BADGE_BLOCKED_TEXT_COLOR = "#4a4a4a";
  var BADGE_SELECTION_TEXT = "◉";
  var BADGE_SELECTION_TEXT_COLOR_WHITE = [255, 255, 255];
  var BADGE_SELECTION_TEXT_COLOR_BLUE = [1, 34, 146];
  var BADGE_COPIED_TEXT = "✓";
  var BADGE_BLOCKED_TEXT = "✕";
  var BADGE_SELECTION_ANIMATION_STEPS = 40;
  var BADGE_SELECTION_ANIMATION_STEP_MS = 25;
  var selectionBadgeTextAnimation = createBadgeTextColorAnimation({
    startColor: BADGE_SELECTION_TEXT_COLOR_WHITE,
    endColor: BADGE_SELECTION_TEXT_COLOR_BLUE,
    steps: BADGE_SELECTION_ANIMATION_STEPS,
    stepIntervalMs: BADGE_SELECTION_ANIMATION_STEP_MS,
    mode: "ping-pong"
  });
  var tabBlockedBadge = /* @__PURE__ */ new Map();
  var tabPrefixBadgeShown = /* @__PURE__ */ new Map();
  var tabCopiedBadge = /* @__PURE__ */ new Map();
  var blockedBadgeClearTimers = /* @__PURE__ */ new Map();
  var selectionBadgeAnimationIntervals = /* @__PURE__ */ new Map();
  var selectionBadgeAnimationFrame = /* @__PURE__ */ new Map();
  function clearBlockedBadgeTimer(tabId) {
    const timer = blockedBadgeClearTimers.get(tabId);
    if (timer === void 0) return;
    clearTimeout(timer);
    blockedBadgeClearTimers.delete(tabId);
  }
  function clearBlockedBadgeState(tabId) {
    clearBlockedBadgeTimer(tabId);
    tabBlockedBadge.set(tabId, false);
  }
  function clearSelectionBadgeAnimation(tabId) {
    const interval = selectionBadgeAnimationIntervals.get(tabId);
    if (interval !== void 0) {
      clearInterval(interval);
      selectionBadgeAnimationIntervals.delete(tabId);
    }
    selectionBadgeAnimationFrame.delete(tabId);
  }
  function ensureSelectionBadgeAnimation(tabId) {
    if (selectionBadgeAnimationIntervals.has(tabId)) return;
    selectionBadgeAnimationFrame.set(tabId, 0);
    selectionBadgeAnimationIntervals.set(
      tabId,
      setInterval(() => {
        if (!getTabActiveState(tabId)) {
          clearSelectionBadgeAnimation(tabId);
          return;
        }
        const currentFrame = selectionBadgeAnimationFrame.get(tabId) ?? 0;
        selectionBadgeAnimationFrame.set(
          tabId,
          selectionBadgeTextAnimation.nextFrame(currentFrame)
        );
        void syncToolbarBadge(tabId);
      }, selectionBadgeTextAnimation.stepIntervalMs)
    );
  }
  function onBlockedNoticeDismissed(tabId) {
    if (!tabBlockedBadge.get(tabId)) return;
    clearBlockedBadgeState(tabId);
    void syncToolbarBadge(tabId);
  }
  function scheduleClearBlockedBadge(tabId, dismissMs) {
    clearBlockedBadgeTimer(tabId);
    blockedBadgeClearTimers.set(
      tabId,
      setTimeout(() => {
        blockedBadgeClearTimers.delete(tabId);
        if (!tabBlockedBadge.get(tabId)) return;
        clearBlockedBadgeState(tabId);
        void syncToolbarBadge(tabId);
      }, dismissMs)
    );
  }
  async function showBlockedPageFeedback(tabId, windowId, reason) {
    console.warn("[Element Copier] page blocked:", reason ?? "unknown", tabId);
    tabBlockedBadge.set(tabId, true);
    await syncToolbarBadge(tabId);
    const dismissMs = await getRestrictedNoticeDismissMs();
    await showRestrictedNotice(tabId, windowId);
    scheduleClearBlockedBadge(tabId, dismissMs);
  }
  async function setToolbarBadge(tabId, text, backgroundColor = BADGE_SELECTION_BACKGROUND_COLOR, textColor = BADGE_TEXT_COLOR) {
    try {
      if (text) {
        await ext.action.setBadgeBackgroundColor({ tabId, color: backgroundColor });
        const setBadgeTextColor = ext.action.setBadgeTextColor;
        await setBadgeTextColor?.({ tabId, color: textColor });
      }
      await ext.action.setBadgeText({ tabId, text });
    } catch (err) {
      console.warn("[Element Copier] setBadgeText failed:", err);
    }
  }
  async function syncToolbarBadge(tabId) {
    if (tabPrefixBadgeShown.get(tabId)) {
      clearSelectionBadgeAnimation(tabId);
      return;
    }
    if (tabBlockedBadge.get(tabId)) {
      clearSelectionBadgeAnimation(tabId);
      await setToolbarBadge(
        tabId,
        BADGE_BLOCKED_TEXT,
        BADGE_BLOCKED_BACKGROUND_COLOR,
        BADGE_BLOCKED_TEXT_COLOR
      );
      return;
    }
    if (getTabActiveState(tabId)) {
      ensureSelectionBadgeAnimation(tabId);
      const frame = selectionBadgeAnimationFrame.get(tabId) ?? 0;
      await setToolbarBadge(
        tabId,
        BADGE_SELECTION_TEXT,
        BADGE_SELECTION_BACKGROUND_COLOR,
        selectionBadgeTextAnimation.getColor(frame)
      );
      return;
    }
    if (tabCopiedBadge.get(tabId)) {
      clearSelectionBadgeAnimation(tabId);
      await setToolbarBadge(tabId, BADGE_COPIED_TEXT, BADGE_COPIED_BACKGROUND_COLOR);
      return;
    }
    clearSelectionBadgeAnimation(tabId);
    await setToolbarBadge(tabId, "");
  }
  function setCopiedBadge(tabId, shown) {
    tabCopiedBadge.set(tabId, shown);
  }
  function clearTabBadgeState(tabId) {
    clearBlockedBadgeTimer(tabId);
    clearSelectionBadgeAnimation(tabId);
    tabBlockedBadge.delete(tabId);
    tabPrefixBadgeShown.delete(tabId);
    tabCopiedBadge.delete(tabId);
  }
  function registerToolbarPrefixBadgeListeners(canShowPrefixBadgeOnTab2) {
    registerPrefixHintBadgeListeners({
      badgeBackgroundColor: BADGE_PREFIX_BACKGROUND_COLOR,
      badgeTextColor: BADGE_PREFIX_TEXT_COLOR,
      canShowPrefixBadgeOnTab: canShowPrefixBadgeOnTab2,
      onShow: (tabId) => {
        if (tabId === void 0) return;
        tabPrefixBadgeShown.set(tabId, true);
      },
      onHide: (tabId) => {
        if (tabId === void 0) return;
        tabPrefixBadgeShown.set(tabId, false);
        void syncToolbarBadge(tabId);
      }
    });
  }

  // src/pick-mode/pick-copy-cache-storage.ts
  var PICK_COPY_CACHE_STORAGE_KEY = "pickCopyCache";
  var PICK_COPY_CACHE_INDEX_KEY = "pickCopyCacheFormats";
  var pickCopyCachePresentSync = false;
  function hasPickCopyCachePresentSync() {
    return pickCopyCachePresentSync;
  }
  function applyPickCopyCachePresence(record, index) {
    pickCopyCachePresentSync = record !== void 0 && Object.keys(record).length > 0 || Array.isArray(index) && index.length > 0;
  }
  function resolvePickCopyCacheStorageKey(formatId) {
    if (formatId === "markdownFile") return "markdown";
    if (formatId === "htmlFile") return "outerHTML";
    return formatId;
  }
  async function readPickCopyCacheFromStorage() {
    const data = await ext.storage.local.get(PICK_COPY_CACHE_STORAGE_KEY);
    const record = data[PICK_COPY_CACHE_STORAGE_KEY];
    if (!record || typeof record !== "object") return void 0;
    return record;
  }
  async function hasPickCopyCacheInStorage() {
    const record = await readPickCopyCacheFromStorage();
    const data = await ext.storage.local.get(PICK_COPY_CACHE_INDEX_KEY);
    applyPickCopyCachePresence(record, data[PICK_COPY_CACHE_INDEX_KEY]);
    return pickCopyCachePresentSync;
  }
  async function refreshPickCopyCachePresenceSync() {
    return hasPickCopyCacheInStorage();
  }
  async function getPickCopyTextFromStorage(formatId) {
    const record = await readPickCopyCacheFromStorage();
    if (!record) return void 0;
    return record[resolvePickCopyCacheStorageKey(formatId)];
  }

  // src/panel-popup/constants.ts
  var PANEL_POPUP_PAGE = "panel-popup-page.html";
  var PANEL_POPUP_SESSION_TAB_KEY = "panelPopupTab";
  var PANEL_SESSION_PORT_NAME = "element-copier-panel-session";
  var PANEL_MENU_TABS = [
    "start",
    "copied",
    "settings",
    "shortcuts",
    "about"
  ];
  var PANEL_POPUP_TABS = [...PANEL_MENU_TABS, "loading"];
  var PANEL_PAGE_CONFIG = {
    pageHtml: PANEL_POPUP_PAGE,
    sessionTabKey: PANEL_POPUP_SESSION_TAB_KEY,
    logLabel: "Element Copier"
  };

  // src/lib/our/panel-popup/page-path.ts
  function panelPagePath(pageHtml, panelTab, extraParams, tabQueryParam = "tab") {
    const params = new URLSearchParams({ [tabQueryParam]: panelTab, ...extraParams });
    return `${pageHtml}?${params.toString()}`;
  }

  // src/lib/our/panel-popup/open-action-popup.ts
  function openPanelInActionPopup(config, panelTab, target, fallbackOpenInTab, extraParams) {
    const { tabId, windowId } = target;
    const popup = panelPagePath(
      config.pageHtml,
      panelTab,
      extraParams,
      config.tabQueryParam
    );
    const setPopupDetails = tabId !== void 0 ? { tabId, popup } : { popup };
    const clearPopupDetails = tabId !== void 0 ? { tabId, popup: "" } : { popup: "" };
    void (async () => {
      await ext.action.setPopup(setPopupDetails);
      try {
        const openPopup = ext.action.openPopup;
        if (!openPopup) throw new Error("action.openPopup unavailable");
        await openPopup({ windowId });
      } catch (err) {
        console.warn(`[${config.logLabel}] openPopup panel failed, using tab:`, err);
        await fallbackOpenInTab(panelTab);
      } finally {
        await ext.action.setPopup(clearPopupDetails);
      }
    })();
  }

  // src/panel-popup/panel-target-tab.ts
  var PANEL_TARGET_TAB_SESSION_KEY = "panelTargetTabId";
  async function rememberPanelTargetTab(tabId) {
    await ext.storage.session.set({ [PANEL_TARGET_TAB_SESSION_KEY]: tabId });
  }
  async function readPanelTargetTabId() {
    const data = await ext.storage.session.get(PANEL_TARGET_TAB_SESSION_KEY);
    const id = data[PANEL_TARGET_TAB_SESSION_KEY];
    return typeof id === "number" ? id : void 0;
  }

  // src/panel-popup/panel-session.ts
  var panelSessionActive = false;
  function markPanelSessionOpened() {
    panelSessionActive = true;
  }
  function consumePanelSessionClose() {
    if (!panelSessionActive) return false;
    panelSessionActive = false;
    return true;
  }

  // src/panel-popup/open.ts
  function openPanelInActionPopup2(panelTab, target) {
    markPanelSessionOpened();
    if (target.tabId !== void 0) {
      void rememberPanelTargetTab(target.tabId);
    }
    openPanelInActionPopup(
      PANEL_PAGE_CONFIG,
      panelTab,
      target,
      async () => {
      }
    );
  }
  function openPanelFromSender(panelTab, senderTab) {
    openPanelInActionPopup2(panelTab, {
      tabId: senderTab?.id,
      windowId: senderTab?.windowId
    });
  }
  function openStartPanelFromToolbar(senderTab) {
    const tab = hasPickCopyCachePresentSync() ? "copied" : "start";
    openPanelFromSender(tab, senderTab);
  }
  function openCopiedPanelFromCopy(senderTab) {
    openPanelFromSender("copied", senderTab);
  }

  // src/about.ts
  function buildAboutListItems(copy) {
    return copy.aboutBullets.map((text, index) => ({
      iconKind: "bool",
      iconHtml: ABOUT_BULLET_ICONS[index] ?? ABOUT_BULLET_ICONS[0],
      text
    }));
  }

  // src/formats/definitions.ts
  var COPY_FORMATS = [
    {
      id: "outerHTML",
      label: (s) => s.formatCode,
      actionIcon: "copy",
      settingsGroup: "devtools"
    },
    {
      id: "selector",
      label: (s) => s.formatSelector,
      actionIcon: "copy",
      settingsGroup: "devtools"
    },
    {
      id: "jsPath",
      label: (s) => s.formatJsPath,
      actionIcon: "copy",
      settingsGroup: "devtools"
    },
    {
      id: "xpath",
      label: (s) => s.formatXPath,
      actionIcon: "copy",
      settingsGroup: "devtools"
    },
    {
      id: "fullXPath",
      label: (s) => s.formatFullXPath,
      actionIcon: "copy",
      settingsGroup: "devtools"
    },
    {
      id: "styles",
      label: (s) => s.formatStyles,
      actionIcon: "copy",
      settingsGroup: "devtools"
    },
    {
      id: "computedStyles",
      label: (s) => s.formatComputedStyles,
      actionIcon: "copy",
      settingsGroup: "devtools"
    },
    {
      id: "text",
      label: (s) => s.formatText,
      actionIcon: "copy",
      settingsGroup: "clipboard-copy"
    },
    {
      id: "markdown",
      label: (s) => s.formatMarkdown,
      actionIcon: "copy",
      settingsGroup: "clipboard-copy"
    },
    {
      id: "png",
      label: (s) => s.formatPng,
      actionIcon: "images",
      settingsGroup: "clipboard-copy"
    },
    {
      id: "markdownFile",
      label: (s) => s.formatMarkdown,
      actionIcon: "file-down",
      settingsGroup: "files"
    },
    {
      id: "htmlFile",
      label: (s) => s.formatHtml,
      actionIcon: "file-down",
      settingsGroup: "files"
    },
    {
      id: "jpeg",
      label: (s) => s.formatJpeg,
      actionIcon: "images",
      settingsGroup: "copy-images"
    }
  ];
  function isClipboardCopyFormat(format) {
    return format.actionIcon === "copy";
  }
  var CLIPBOARD_COPY_FORMATS = COPY_FORMATS.filter(isClipboardCopyFormat);
  var COPY_FORMAT_ID_VALUES = [
    ...COPY_FORMATS.map((format) => format.id),
    "url"
  ];

  // src/lib/our/info-window/info-window.ts
  function createInfoWindowClasses(prefix) {
    return {
      overlay: `${prefix}-info-window-overlay`,
      window: `${prefix}-info-window`,
      close: `${prefix}-info-window-close`,
      content: `${prefix}-info-window-content`
    };
  }

  // src/settings/format-settings.ts
  var DEVTOOLS_FORMAT_IDS = COPY_FORMATS.filter(
    (format) => format.settingsGroup === "devtools"
  ).map((format) => format.id);

  // src/formats/format-ui.ts
  var INFO_WINDOW_CLASSES = createInfoWindowClasses("ec");

  // src/settings/copied-session.ts
  var LAST_COPIED_FORMAT_KEY = "lastCopiedFormat";
  var LAST_DOWNLOADED_FORMAT_KEY = "lastDownloadedFormat";
  var LAST_COPIED_PANEL_ACTION_KEY = "lastCopiedPanelAction";
  var COPIED_PANEL_SHOW_STATUS_KEY = "copiedPanelShowStatus";
  async function setLastCopiedFormat(formatId) {
    if (formatId === null) {
      await ext.storage.session.remove(LAST_COPIED_FORMAT_KEY);
      await ext.storage.session.remove(LAST_COPIED_PANEL_ACTION_KEY);
      return;
    }
    await ext.storage.session.set({
      [LAST_COPIED_FORMAT_KEY]: formatId,
      [LAST_COPIED_PANEL_ACTION_KEY]: "copied"
    });
  }
  async function setLastDownloadedFormat(formatId) {
    await ext.storage.session.set({
      [LAST_DOWNLOADED_FORMAT_KEY]: formatId,
      [LAST_COPIED_PANEL_ACTION_KEY]: "saved"
    });
  }
  async function markCopiedPanelShowStatus() {
    await ext.storage.session.set({ [COPIED_PANEL_SHOW_STATUS_KEY]: true });
  }
  async function clearCopiedPanelShowStatus() {
    await ext.storage.session.remove(COPIED_PANEL_SHOW_STATUS_KEY);
  }

  // src/background-context-menu.ts
  var CONTEXT_MENU_START = "element-copier-start";
  var CONTEXT_MENU_COPIED = "element-copier-copied";
  var CONTEXT_MENU_SETTINGS = "element-copier-settings";
  var CONTEXT_MENU_SHORTCUTS = "element-copier-shortcuts";
  var CONTEXT_MENU_ABOUT = "element-copier-about";
  var ACTION_MENU_EMOJI = {
    start: "▶️",
    copied: "🗂️",
    settings: "⚙️",
    shortcuts: "⌨️",
    about: "ℹ️"
  };
  var CONTEXT_MENU_START_ITEM = {
    id: CONTEXT_MENU_START,
    tab: "start",
    emoji: ACTION_MENU_EMOJI.start,
    title: (strings) => strings.titleSettings
  };
  var CONTEXT_MENU_COPIED_ITEM = {
    id: CONTEXT_MENU_COPIED,
    tab: "copied",
    emoji: ACTION_MENU_EMOJI.copied,
    title: (strings) => strings.tabCopied
  };
  var CONTEXT_MENU_SECONDARY_ITEMS = [
    {
      id: CONTEXT_MENU_SETTINGS,
      tab: "settings",
      emoji: ACTION_MENU_EMOJI.settings,
      title: (strings) => strings.pageSettingsTitle
    },
    {
      id: CONTEXT_MENU_SHORTCUTS,
      tab: "shortcuts",
      emoji: ACTION_MENU_EMOJI.shortcuts,
      title: (strings) => strings.tabShortcuts
    },
    {
      id: CONTEXT_MENU_ABOUT,
      tab: "about",
      emoji: ACTION_MENU_EMOJI.about,
      title: (strings) => strings.tabAbout
    }
  ];
  var ensureContextMenuChain = Promise.resolve();
  async function createContextMenuItem(props) {
    try {
      await ext.contextMenus.create(props);
    } catch (err) {
      console.error("[Element Copier] contextMenus.create failed:", err, props);
    }
  }
  function actionMenuTitle(title, emoji, locale) {
    return isRtlLocale(locale) ? `${title} ${emoji}` : `${emoji} ${title}`;
  }
  async function ensureContextMenu() {
    ensureContextMenuChain = ensureContextMenuChain.then(async () => {
      const locale = await getLocale();
      const strings = t(locale);
      try {
        await ext.contextMenus.removeAll();
      } catch (err) {
        console.error("[Element Copier] contextMenus.removeAll failed:", err);
      }
      const hasCache = await hasPickCopyCacheInStorage();
      const primaryItem = hasCache ? CONTEXT_MENU_COPIED_ITEM : CONTEXT_MENU_START_ITEM;
      const contextMenuItems = [primaryItem, ...CONTEXT_MENU_SECONDARY_ITEMS];
      for (const item of contextMenuItems) {
        await createContextMenuItem({
          id: item.id,
          title: actionMenuTitle(item.title(strings), item.emoji, locale),
          contexts: ["action"]
        });
      }
    });
    await ensureContextMenuChain;
  }
  function findContextMenuTab(menuItemId) {
    if (menuItemId === CONTEXT_MENU_START) return "start";
    if (menuItemId === CONTEXT_MENU_COPIED) return "copied";
    return CONTEXT_MENU_SECONDARY_ITEMS.find((item) => item.id === menuItemId)?.tab;
  }

  // src/lib/our/pin.ts
  async function isActionOnToolbar(action) {
    if (typeof action.getUserSettings !== "function") return null;
    try {
      const settings = await action.getUserSettings();
      return settings.isOnToolbar === true;
    } catch {
      return null;
    }
  }
  function onActionToolbarChanged(action, listener) {
    const handler = (change) => {
      if (typeof change.isOnToolbar === "boolean") {
        listener(change.isOnToolbar);
      }
    };
    if (typeof action.onUserSettingsChanged?.addListener === "function") {
      action.onUserSettingsChanged.addListener(handler);
      return () => {
        action.onUserSettingsChanged?.removeListener(handler);
      };
    }
    let stopped = false;
    const poll = async () => {
      while (!stopped) {
        const pinned = await isActionOnToolbar(action);
        if (pinned === true) {
          listener(true);
          return;
        }
        await new Promise((resolve) => globalThis.setTimeout(resolve, 750));
      }
    };
    void poll();
    return () => {
      stopped = true;
    };
  }

  // src/lib/our/welcome/background.ts
  var welcomePinWatchers = /* @__PURE__ */ new Map();
  function stopWelcomePinWatcher(tabId) {
    welcomePinWatchers.get(tabId)?.();
    welcomePinWatchers.delete(tabId);
  }
  function notifyWelcomePinned(tabId, messageType) {
    void ext.tabs.sendMessage(tabId, { type: messageType, pinned: true }).catch(() => {
    });
    stopWelcomePinWatcher(tabId);
  }
  function watchWelcomePinStatus(tabId, config) {
    stopWelcomePinWatcher(tabId);
    void isActionOnToolbar(ext.action).then((pinned) => {
      if (pinned === true) notifyWelcomePinned(tabId, config.pinStatusChangedMessageType);
    });
    const stop = onActionToolbarChanged(ext.action, (pinned) => {
      if (!pinned) return;
      notifyWelcomePinned(tabId, config.pinStatusChangedMessageType);
    });
    welcomePinWatchers.set(tabId, stop);
  }
  async function openWelcomeTab(config, data) {
    await ext.storage.session.set({
      [config.sessionDataKey]: data
    });
    try {
      await ext.tabs.create({
        url: ext.runtime.getURL(config.pageHtml),
        active: true
      });
    } catch (err) {
      console.error(`[${config.logLabel}] welcome tab failed:`, err);
    }
  }

  // src/lib/our/welcome/step-icon.ts
  function welcomeStepIcon(raw, size = 14) {
    return raw.replace("<svg ", `<svg width="${size}" height="${size}" `);
  }

  // src/welcome/constants.ts
  var WELCOME_PAGE = "welcome.html";
  var WELCOME_SESSION_DATA_KEY = "welcomeData";
  var WELCOME_TAB_CONFIG = {
    pageHtml: WELCOME_PAGE,
    sessionDataKey: WELCOME_SESSION_DATA_KEY,
    logLabel: "Element Copier"
  };
  var WELCOME_PIN_WATCH_CONFIG = {
    pinStatusChangedMessageType: "PIN_STATUS_CHANGED"
  };

  // src/welcome/data.ts
  function buildWelcomeLocalePayload(locale) {
    const strings = t(locale);
    return {
      locale,
      dir: isRtlLocale(locale) ? "rtl" : "ltr",
      headerSubtitle: strings.panelSubtitle,
      pinHeading: strings.welcomePin,
      pinStep1: strings.welcomePinStep1,
      pinStep2: strings.welcomePinStep2,
      pinStep3: strings.welcomePinStep3,
      aboutHeading: strings.tabAbout,
      aboutItems: buildAboutListItems(strings),
      langAriaLabel: strings.pageSettingsTitle
    };
  }
  function buildWelcomeData(locale, extensionName, options) {
    const isPinned = options?.isPinned === true;
    const perLocale = Object.fromEntries(
      LOCALES.map((code) => [code, buildWelcomeLocalePayload(code)])
    );
    const current = perLocale[locale];
    return {
      extensionName,
      locale,
      dir: current.dir,
      headerLogoSvg: toolbarWelcomeIconSvg(),
      headerTitle: PANEL_TITLE,
      headerSubtitle: current.headerSubtitle,
      iconSvg: toolbarWelcomeIconSvg(),
      pinHeading: current.pinHeading,
      pinStep1: current.pinStep1,
      pinStep2: current.pinStep2,
      pinStep3: current.pinStep3,
      puzzleIcon: welcomeStepIcon(PUZZLE),
      pinIcon: welcomeStepIcon(PIN),
      arrowUpIcon: welcomeStepIcon(ARROW_UP, 28),
      pinHintIcon: welcomeStepIcon(PIN, 16),
      heartIcon: welcomeStepIcon(HEART, 56),
      isPinned,
      aboutHeading: current.aboutHeading,
      aboutItems: current.aboutItems,
      hasAbout: true,
      hasLocales: true,
      locales: [...LOCALES],
      localeLabels: LOCALE_BUTTON_LABELS,
      langAriaLabel: current.langAriaLabel,
      perLocale
    };
  }

  // src/welcome/background.ts
  function stopWelcomePinWatcher2(tabId) {
    stopWelcomePinWatcher(tabId);
  }
  function watchWelcomePinStatus2(tabId) {
    watchWelcomePinStatus(tabId, WELCOME_PIN_WATCH_CONFIG);
  }
  async function showWelcome() {
    const locale = await getLocale();
    const manifest = ext.runtime.getManifest();
    const isPinned = await isActionOnToolbar(ext.action);
    await openWelcomeTab(
      WELCOME_TAB_CONFIG,
      buildWelcomeData(locale, manifest.name, { isPinned })
    );
  }

  // src/background.ts
  var TOGGLE_DEBOUNCE_MS = 80;
  var MAIN_FRAME_ID = 0;
  var PICK_LOADING_PANEL_DELAY_MS = 500;
  var pickCopyLoadingTimers = /* @__PURE__ */ new Map();
  function isLikelyNonOperableTabUrl(url) {
    if (!url) return false;
    try {
      const { protocol } = new URL(url);
      return protocol === "chrome:" || protocol === "chrome-extension:" || protocol === "moz-extension:" || protocol === "edge:" || protocol === "about:" || protocol === "devtools:";
    } catch {
      return false;
    }
  }
  var lastToggleTabId;
  var lastToggleAt = 0;
  async function injectContent(tabId, frameId) {
    try {
      const target = frameId === void 0 ? { tabId } : { tabId, frameIds: [frameId] };
      await ext.scripting.executeScript({
        target,
        files: ["content.js"]
      });
      return true;
    } catch (err) {
      console.warn("[Element Copier] injectContent failed:", err);
      return false;
    }
  }
  function isActivationSuccess(message, response) {
    if (message.type === "SET_ACTIVE" && message.active) {
      return response?.ok === true;
    }
    return true;
  }
  async function sendToTab(tabId, message, frameId) {
    try {
      const response = frameId === void 0 ? await ext.tabs.sendMessage(tabId, message) : await ext.tabs.sendMessage(tabId, message, { frameId });
      return isActivationSuccess(message, response);
    } catch (err) {
      console.warn("[Element Copier] sendToTab failed:", err);
      return false;
    }
  }
  async function sendWithInject(tabId, message, frameId) {
    if (await sendToTab(tabId, message, frameId)) return true;
    if (!await injectContent(tabId, frameId)) return false;
    return sendToTab(tabId, message, frameId);
  }
  async function handlePanelSessionEnded() {
    await clearCopiedPanelShowStatus();
    if (!consumePanelSessionClose()) return;
    const tabId = await readPanelTargetTabId();
    if (tabId === void 0) return;
    setCopiedBadge(tabId, false);
    await syncToolbarBadge(tabId);
  }
  async function setTabActive(tabId, active, windowId) {
    if (active && !await canOperateOnTab(tabId)) {
      setTabActiveState(tabId, false);
      await syncIconForTab(tabId);
      await showBlockedPageFeedback(tabId, windowId, "canOperateOnTab:setTabActive");
      return;
    }
    const reached = active ? await sendWithInject(tabId, { type: "SET_ACTIVE", active: true }, MAIN_FRAME_ID) : await sendToTab(tabId, { type: "SET_ACTIVE", active: false }, MAIN_FRAME_ID);
    if (active && !reached) {
      setTabActiveState(tabId, false);
      await syncIconForTab(tabId);
      await sendToTab(tabId, { type: "SET_ACTIVE", active: false }, MAIN_FRAME_ID);
      console.warn(
        "[Element Copier] pick mode activation failed on tab",
        tabId,
        windowId ?? ""
      );
      await showBlockedPageFeedback(tabId, windowId, "setTabActive:activationFailed");
      return;
    }
    if (active && reached) {
      clearBlockedBadgeState(tabId);
    }
    if (!active) {
      clearBlockedBadgeState(tabId);
    }
    await syncToolbarBadge(tabId);
  }
  async function deactivateTab(tabId, windowId) {
    if (!getTabActiveState(tabId)) return;
    setTabActiveState(tabId, false);
    clearBlockedBadgeState(tabId);
    setCopiedBadge(tabId, false);
    await syncIconForTab(tabId);
    await syncToolbarBadge(tabId);
    await setTabActive(tabId, false, windowId);
  }
  async function activateTab(tabId, windowId) {
    if (getTabActiveState(tabId)) {
      await setTabActive(tabId, true, windowId);
      return;
    }
    if (!await canOperateOnTab(tabId)) {
      setTabActiveState(tabId, false);
      await syncIconForTab(tabId);
      await showBlockedPageFeedback(tabId, windowId, "canOperateOnTab:activateTab");
      return;
    }
    setTabActiveState(tabId, true);
    clearBlockedBadgeState(tabId);
    setCopiedBadge(tabId, false);
    await syncIconForTab(tabId);
    await syncToolbarBadge(tabId);
    await setTabActive(tabId, true, windowId);
  }
  function isExtensionPanelSenderUrl(url) {
    if (!url) return false;
    return url.includes(PANEL_POPUP_PAGE) || url.includes("welcome.html");
  }
  async function resolvePickModeTabId(sender) {
    const senderUrl = sender.tab?.url;
    if (sender.tab?.id !== void 0 && !isExtensionPanelSenderUrl(senderUrl)) {
      return sender.tab.id;
    }
    const remembered = await readPanelTargetTabId();
    if (remembered !== void 0) return remembered;
    const tab = await getActiveCommandTab();
    return tab?.id;
  }
  async function getPickCopyTextForPanel(formatId, sender) {
    const fromStorage = await getPickCopyTextFromStorage(formatId);
    if (fromStorage !== void 0) return fromStorage;
    const tabId = await resolvePickModeTabId(sender);
    if (tabId === void 0) return void 0;
    try {
      const response = await ext.tabs.sendMessage(
        tabId,
        { type: "GET_PICK_COPY_TEXT", formatId },
        { frameId: MAIN_FRAME_ID }
      );
      if (!response?.ok || response.text === void 0) return void 0;
      return response.text;
    } catch {
      return void 0;
    }
  }
  function normalizeUrl(url) {
    if (!url) return void 0;
    try {
      return new URL(url).href;
    } catch {
      return void 0;
    }
  }
  async function openCachedUrl(targetUrl) {
    const normalizedUrl = normalizeUrl(targetUrl);
    if (!normalizedUrl) {
      return { ok: false };
    }
    try {
      await ext.tabs.create({ url: normalizedUrl });
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }
  async function syncPickModeForPanelTab(_tab, sender) {
    const tabId = await resolvePickModeTabId(sender);
    if (tabId === void 0) return;
    await deactivateTab(tabId, sender.tab?.windowId);
  }
  function clearPickCopyLoadingTimer(tabId, requestId) {
    const current = pickCopyLoadingTimers.get(tabId);
    if (!current) return;
    if (requestId !== void 0 && current.requestId !== requestId) return;
    clearTimeout(current.timer);
    pickCopyLoadingTimers.delete(tabId);
  }
  function schedulePickCopyLoadingPanel(sender, requestId, startedAtMs) {
    const tabId = sender.tab?.id;
    if (tabId === void 0) return;
    clearPickCopyLoadingTimer(tabId);
    const elapsedMs = Math.max(0, Date.now() - startedAtMs);
    const delayMs = Math.max(0, PICK_LOADING_PANEL_DELAY_MS - elapsedMs);
    const timer = setTimeout(() => {
      const current = pickCopyLoadingTimers.get(tabId);
      if (!current || current.requestId !== requestId) return;
      pickCopyLoadingTimers.delete(tabId);
      void (async () => {
        const switched = await switchOpenPopupTab("loading");
        if (!switched) {
          openPanelFromSender("loading", sender.tab);
        }
      })();
    }, delayMs);
    pickCopyLoadingTimers.set(tabId, { requestId, timer });
  }
  async function switchOpenPopupTab(tab) {
    try {
      const response = await ext.runtime.sendMessage({
        type: "SET_POPUP_TAB",
        tab
      });
      return response?.ok === true;
    } catch {
      return false;
    }
  }
  async function toggleTab(tabId, windowId, tabUrl, source = "toolbar") {
    const now = Date.now();
    if (tabId === lastToggleTabId && now - lastToggleAt < TOGGLE_DEBOUNCE_MS) {
      return;
    }
    lastToggleTabId = tabId;
    lastToggleAt = now;
    const next = !getTabActiveState(tabId);
    if (!next) {
      setTabActiveState(tabId, false);
      clearBlockedBadgeState(tabId);
      setCopiedBadge(tabId, false);
      await syncIconForTab(tabId);
      await syncToolbarBadge(tabId);
      await setTabActive(tabId, false, windowId);
      return;
    }
    if (source === "hotkey") {
      await activateTab(tabId, windowId);
      return;
    }
    if (tabUrl !== void 0 && isLikelyNonOperableTabUrl(tabUrl)) {
      await activateTab(tabId, windowId);
      return;
    }
    openStartPanelFromToolbar({ id: tabId, windowId });
    await deactivateTab(tabId, windowId);
  }
  function getActiveCommandTab() {
    return new Promise((resolve) => {
      ext.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab?.id !== void 0) {
          resolve(tab);
          return;
        }
        ext.tabs.query({ active: true, currentWindow: true }, (fallback) => {
          resolve(fallback[0]);
        });
      });
    });
  }
  ext.action.onClicked.addListener((tab) => {
    if (tab.id === void 0) return;
    if (shouldSuppressToolbarClickAfterHotkeyCommand()) {
      console.log("[Element Copier] toolbar click suppressed (after _execute_action)");
      return;
    }
    console.log("[Element Copier] toolbar click → toggleTab", tab.id);
    void toggleTab(tab.id, tab.windowId, tab.url);
  });
  registerBackgroundHotkeys({
    getActiveCommandTab,
    toggleTab
  });
  registerPrefixHintOperabilityListeners({
    canOperateOnTab,
    onBlockedOnTab: (tabId, windowId) => showBlockedPageFeedback(tabId, windowId, "prefixHint")
  });
  ext.contextMenus.onClicked.addListener((info, tab) => {
    const panelTab = findContextMenuTab(info.menuItemId);
    if (panelTab === void 0) return;
    void (async () => {
      await syncPickModeForPanelTab(panelTab, { tab });
      openPanelFromSender(panelTab, tab);
    })();
  });
  ext.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
      if (isBlockedNoticeDismissedMessage(message)) {
        onBlockedNoticeDismissed(message.tabId);
        return;
      }
      const contentMessage = message;
      if (contentMessage.type === "ACTIVE_CHANGED" && sender.tab?.id !== void 0) {
        const tabId = sender.tab.id;
        onContentActiveChanged2(tabId, contentMessage.active);
        if (!contentMessage.active) {
          clearBlockedBadgeState(tabId);
        }
        void syncToolbarBadge(tabId);
      }
      if (contentMessage.type === "OPEN_PANEL") {
        if (contentMessage.tab === "copied") {
          void (async () => {
            if (contentMessage.formatId !== null) {
              if (contentMessage.panelAction === "download") {
                await setLastDownloadedFormat(contentMessage.formatId);
              } else {
                await setLastCopiedFormat(contentMessage.formatId);
              }
            } else {
              await setLastCopiedFormat(null);
            }
            await markCopiedPanelShowStatus();
            if (sender.tab?.id !== void 0) {
              clearPickCopyLoadingTimer(sender.tab.id);
              await rememberPanelTargetTab(sender.tab.id);
              setCopiedBadge(sender.tab.id, true);
              await syncToolbarBadge(sender.tab.id);
            }
            const switched = await switchOpenPopupTab("copied");
            if (!switched) {
              openCopiedPanelFromCopy(sender.tab);
            }
          })();
          return;
        }
        void (async () => {
          await syncPickModeForPanelTab(contentMessage.tab, sender);
          openPanelFromSender(contentMessage.tab, sender.tab);
        })();
      }
      if (contentMessage.type === "PANEL_TAB_CHANGED") {
        void (async () => {
          const tabId = await resolvePickModeTabId(sender);
          if (tabId !== void 0) {
            setCopiedBadge(tabId, contentMessage.tab === "copied");
            await syncToolbarBadge(tabId);
          }
          await syncPickModeForPanelTab(contentMessage.tab, sender);
        })();
      }
      if (contentMessage.type === "PANEL_CLOSED") {
        void handlePanelSessionEnded();
      }
      if (contentMessage.type === "REQUEST_START_PICK_MODE") {
        void (async () => {
          const tabId = await resolvePickModeTabId(sender);
          if (tabId === void 0) return;
          await activateTab(tabId, sender.tab?.windowId);
        })();
      }
      if (contentMessage.type === "REQUEST_COPY_PAGE") {
        void (async () => {
          const tabId = await resolvePickModeTabId(sender);
          if (tabId === void 0) return;
          if (!await canOperateOnTab(tabId)) {
            await showBlockedPageFeedback(tabId, sender.tab?.windowId, "canOperateOnTab:copyPage");
            return;
          }
          await sendWithInject(tabId, { type: "COPY_PAGE" }, MAIN_FRAME_ID);
        })();
      }
      if (contentMessage.type === "WATCH_PIN_STATUS" && sender.tab?.id !== void 0) {
        watchWelcomePinStatus2(sender.tab.id);
      }
      if (contentMessage.type === "ELEMENT_PICKED") {
        const label = contentMessage.id ? `${contentMessage.tagName}#${contentMessage.id}` : contentMessage.className ? `${contentMessage.tagName}.${contentMessage.className.trim().split(/\s+/).slice(0, 3).join(".")}` : contentMessage.tagName;
        console.log("[Element Copier] element picked:", label);
      }
      if (contentMessage.type === "COPY_PICKED_FORMAT") {
        void (async () => {
          const text = await getPickCopyTextForPanel(contentMessage.formatId, sender);
          if (text === void 0) {
            sendResponse({ ok: false });
            return;
          }
          sendResponse({ ok: true, text });
        })();
        return true;
      }
      if (contentMessage.type === "OPEN_CACHED_URL") {
        void (async () => {
          const response = await openCachedUrl(contentMessage.url);
          sendResponse(response);
        })();
        return true;
      }
      if (contentMessage.type === "PICK_COPY_FLOW_STARTED") {
        schedulePickCopyLoadingPanel(
          sender,
          contentMessage.requestId,
          contentMessage.startedAtMs
        );
        return;
      }
      if (contentMessage.type === "PICK_COPY_FLOW_FINISHED" && sender.tab?.id !== void 0) {
        clearPickCopyLoadingTimer(sender.tab.id, contentMessage.requestId);
      }
    }
  );
  ext.runtime.onConnect.addListener((port) => {
    if (port.name !== PANEL_SESSION_PORT_NAME) return;
    port.onDisconnect.addListener(() => {
      void handlePanelSessionEnded();
    });
  });
  ext.tabs.onRemoved.addListener((tabId) => {
    clearPickCopyLoadingTimer(tabId);
    clearTabBadgeState(tabId);
    stopWelcomePinWatcher2(tabId);
  });
  registerToolbarPrefixBadgeListeners(canOperateOnTab);
  registerExtensionIconStateListeners2();
  ext.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.notificationSeconds || changes.locale) {
      void refreshRestrictedNoticeCache();
    }
    if (changes.locale) {
      void ensureContextMenu();
    }
    if (changes[PICK_COPY_CACHE_STORAGE_KEY] || changes[PICK_COPY_CACHE_INDEX_KEY]) {
      void refreshPickCopyCachePresenceSync();
      void ensureContextMenu();
    }
  });
  var onBootstrap = async () => {
    await ensureLocaleInStorage();
    await refreshPickCopyCachePresenceSync();
    await ensureContextMenu();
    await refreshRestrictedNoticeCache();
    await bootstrapToolbarIcons();
  };
  void ext.runtime.onInstalled.addListener((details) => {
    void onBootstrap();
    if (details.reason === "install") {
      void showWelcome();
    }
  });
  void ext.runtime.onStartup.addListener(() => {
    void onBootstrap();
  });
  void onBootstrap();
})();
