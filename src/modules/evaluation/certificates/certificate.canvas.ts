import {
  CERTIFICATE_ALEGREYA_PATH,
  CERTIFICATE_GREAT_VIBES_PATH,
  CERTIFICATE_HEIGHT,
  CERTIFICATE_TEMPLATE_PATH,
  CERTIFICATE_TEXT_LAYOUT,
  CERTIFICATE_WIDTH,
  CERTIFICATE_PLAY_FAIR_PATH
} from './certificate.constants';
import { CertificateData, CertificateRenderOptions } from './certificate.types';

type CertificateFontFamily = 'Alegreya Certificate' | 'Great Vibes' | 'Playfair Display';

interface LoadedCertificateResources {
  templateImage: HTMLImageElement;
}

interface CertificateTextSpec {
  centerX: number;
  centerY: number;
  maxWidth: number;
  color: string;
  fontFamily: CertificateFontFamily;
  fontWeight: number | string;
  fontSize: number;
  minFontSize: number;
  letterSpacing?: number;
  textTransform?: 'uppercase';
}

let certificateResourcesPromise: Promise<LoadedCertificateResources> | null = null;
const fontLoadPromises = new Map<CertificateFontFamily, Promise<void>>();
const injectedFontFaceIds = new Set<string>();

const getAssetUrl = (path: string): string => {
  if (typeof window === 'undefined') {
    return path;
  }

  return new URL(path, window.location.origin).toString();
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`No se pudo cargar la imagen ${src}`));
    image.src = src;
  });
};

const waitForNextFrame = async (): Promise<void> => {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
};

const ensureFontFaceStyle = (family: CertificateFontFamily, path: string): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const styleId = `certificate-font-${family.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  if (injectedFontFaceIds.has(styleId) || document.getElementById(styleId)) {
    injectedFontFaceIds.add(styleId);
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @font-face {
      font-family: "${family}";
      src: url("${getAssetUrl(path)}") format("truetype");
      font-style: normal;
      font-weight: 400 700;
      font-display: block;
    }
  `;
  document.head.appendChild(style);
  injectedFontFaceIds.add(styleId);
};

const warmUpFont = async (family: CertificateFontFamily, sampleText: string): Promise<void> => {
  if (typeof document === 'undefined' || !document.body) {
    return;
  }

  const probe = document.createElement('span');
  probe.textContent = sampleText;
  probe.setAttribute('aria-hidden', 'true');
  probe.style.position = 'fixed';
  probe.style.opacity = '0';
  probe.style.pointerEvents = 'none';
  probe.style.left = '-9999px';
  probe.style.top = '-9999px';
  probe.style.whiteSpace = 'nowrap';
  probe.style.fontFamily = `"${family}"`;
  probe.style.fontSize = '120px';
  document.body.appendChild(probe);

  try {
    await document.fonts.load(`400 120px "${family}"`, sampleText);
    await waitForNextFrame();
    await waitForNextFrame();
  } finally {
    probe.remove();
  }
};

const ensureFontLoaded = async (
  family: CertificateFontFamily,
  path: string,
  sampleText: string
): Promise<void> => {
  if (typeof document === 'undefined' || typeof window === 'undefined' || !('FontFace' in window)) {
    return;
  }

  ensureFontFaceStyle(family, path);

  let loadPromise = fontLoadPromises.get(family);
  if (!loadPromise) {
    loadPromise = (async () => {
      const assetUrl = getAssetUrl(path);

      try {
        const response = await fetch(assetUrl, { cache: 'force-cache' });
        if (!response.ok) {
          throw new Error(`No se pudo descargar la fuente ${assetUrl}`);
        }

        const fontData = await response.arrayBuffer();
        const font = new FontFace(family, fontData, {
          style: 'normal',
          weight: '400',
        });
        await font.load();
        document.fonts.add(font);
      } catch (error) {
        console.warn(`Fallo la carga binaria de ${family}, usando @font-face como respaldo`, error);
      }

      await document.fonts.load(`400 120px "${family}"`, sampleText);
      await document.fonts.ready;
    })();

    fontLoadPromises.set(family, loadPromise);
  }

  await loadPromise;
  await warmUpFont(family, sampleText);
};

const getCertificateResources = async (): Promise<LoadedCertificateResources> => {
  if (!certificateResourcesPromise) {
    certificateResourcesPromise = (async () => {
      await ensureFontLoaded('Alegreya Certificate', CERTIFICATE_ALEGREYA_PATH, 'COMPENDIO DE TEOLOGIA');
      await ensureFontLoaded('Great Vibes', CERTIFICATE_GREAT_VIBES_PATH, 'Sahira Reyes');
      await ensureFontLoaded('Playfair Display', CERTIFICATE_PLAY_FAIR_PATH, 'SEAN NIVEL 6');

      const templateImage = await loadImage(getAssetUrl(CERTIFICATE_TEMPLATE_PATH));

      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready;
      }

      return {
        templateImage,
      };
    })();
  }

  return certificateResourcesPromise;
};

const getFittedFontSize = (
  context: CanvasRenderingContext2D,
  text: string,
  spec: CertificateTextSpec
): number => {
  let currentSize = spec.fontSize;
  const letterSpacing = spec.letterSpacing || 0;

  while (currentSize > spec.minFontSize) {
    context.font = `${spec.fontWeight} ${currentSize}px "${spec.fontFamily}"`;
    const measuredWidth = context.measureText(text).width + Math.max(text.length - 1, 0) * letterSpacing;
    if (measuredWidth <= spec.maxWidth) {
      return currentSize;
    }
    currentSize -= 2;
  }

  return spec.minFontSize;
};

const drawCenteredText = (
  context: CanvasRenderingContext2D,
  text: string,
  spec: CertificateTextSpec
): void => {
  const content = (spec.textTransform === 'uppercase'
    ? text.toLocaleUpperCase('es')
    : text).trim();
  if (!content) {
    return;
  }

  const fontSize = getFittedFontSize(context, content, spec);
  const letterSpacing = spec.letterSpacing || 0;

  context.save();
  context.fillStyle = spec.color;
  context.textBaseline = 'middle';
  context.font = `${spec.fontWeight} ${fontSize}px "${spec.fontFamily}"`;
  context.shadowColor = 'transparent';
  context.shadowBlur = 0;

  if (letterSpacing <= 0) {
    context.textAlign = 'center';
    context.fillText(content, spec.centerX, spec.centerY, spec.maxWidth);
    context.restore();
    return;
  }

  const glyphWidths = Array.from(content).map((character) => context.measureText(character).width);
  const totalWidth = glyphWidths.reduce((sum, width) => sum + width, 0) + Math.max(content.length - 1, 0) * letterSpacing;
  let currentX = spec.centerX - totalWidth / 2;

  Array.from(content).forEach((character, index) => {
    context.fillText(character, currentX, spec.centerY);
    currentX += glyphWidths[index] + letterSpacing;
  });
  context.restore();
};

const renderCertificate = async (certificate: CertificateData): Promise<HTMLCanvasElement> => {
  const { templateImage } = await getCertificateResources();
  const canvas = document.createElement('canvas');
  canvas.width = CERTIFICATE_WIDTH;
  canvas.height = CERTIFICATE_HEIGHT;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('No fue posible inicializar el lienzo del certificado');
  }

  context.drawImage(templateImage, 0, 0, CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT);

  drawCenteredText(context, certificate.classroomName, CERTIFICATE_TEXT_LAYOUT.classroomHeader);
  drawCenteredText(context, certificate.studentName, CERTIFICATE_TEXT_LAYOUT.studentName);
  drawCenteredText(context, certificate.completionText, CERTIFICATE_TEXT_LAYOUT.completionText);
  drawCenteredText(context, certificate.teacherName, CERTIFICATE_TEXT_LAYOUT.teacherName);

  return canvas;
};

export const generateCertificateBlob = async (
  certificate: CertificateData,
  options: CertificateRenderOptions = {}
): Promise<Blob> => {
  const canvas = await renderCertificate(certificate);
  const format = options.format ?? 'png';
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const quality = options.quality ?? 0.95;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No fue posible generar el archivo del certificado'));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality
    );
  });
};

export const generateCertificateDataUrl = async (
  certificate: CertificateData,
  options: CertificateRenderOptions = {}
): Promise<string> => {
  const blob = await generateCertificateBlob(certificate, options);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('No fue posible leer el certificado generado'));
        return;
      }

      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error('No fue posible leer el certificado generado'));
    reader.readAsDataURL(blob);
  });
};
