import QRCode from "qrcode";

/**
 * Generate QR code for a material passport
 * QR contains: URL to passport verification page + passport ID
 */
export async function generatePassportQR(
  passportId: string,
  options?: {
    size?: number;
    includeMargin?: boolean;
  },
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://econexus.app";
  const verificationUrl = `${baseUrl}/verify/${passportId}`;

  try {
    // Generate QR code as data URL (base64 image)
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: options?.size || 300,
      margin: options?.includeMargin ? 2 : 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M", // Medium error correction
    });

    return qrDataUrl;
  } catch (error) {
    console.error("QR code generation failed:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate QR code as SVG (better for printing)
 */
export async function generatePassportQRSVG(
  passportId: string,
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://econexus.app";
  const verificationUrl = `${baseUrl}/verify/${passportId}`;

  try {
    const qrSvg = await QRCode.toString(verificationUrl, {
      type: "svg",
      width: 300,
      margin: 1,
      errorCorrectionLevel: "M",
    });

    return qrSvg;
  } catch (error) {
    console.error("QR SVG generation failed:", error);
    throw new Error("Failed to generate QR SVG");
  }
}

/**
 * Generate downloadable QR code file
 */
export async function generatePassportQRFile(
  passportId: string,
  format: "png" | "svg" = "png",
): Promise<Buffer> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://econexus.app";
  const verificationUrl = `${baseUrl}/verify/${passportId}`;

  try {
    if (format === "svg") {
      const svg = await QRCode.toString(verificationUrl, { type: "svg" });
      return Buffer.from(svg, "utf-8");
    } else {
      // PNG
      const buffer = await QRCode.toBuffer(verificationUrl, {
        width: 600,
        margin: 2,
      });
      return buffer;
    }
  } catch (error) {
    console.error("QR file generation failed:", error);
    throw new Error("Failed to generate QR file");
  }
}
