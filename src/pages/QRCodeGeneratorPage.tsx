import React, { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  FaDownload,
  FaCheck,
  FaClipboard,
  FaPalette,
  FaImage,
} from "react-icons/fa";
import Header from "../components/Header";

// QR Code style options
const QR_CODE_STYLES = [
  {
    name: "Mint",
    bgColor: "#FFFFFF",
    fgColor: "#3BCEAC",
    cornerSquareColor: "#6A67CE",
    cornerDotColor: "#3BCEAC",
  },
  {
    name: "Purple",
    bgColor: "#FFFFFF",
    fgColor: "#6A67CE",
    cornerSquareColor: "#3BCEAC",
    cornerDotColor: "#6A67CE",
  },
  {
    name: "Minimal",
    bgColor: "#FFFFFF",
    fgColor: "#2A2B2E",
    cornerSquareColor: "#3BCEAC",
    cornerDotColor: "#6A67CE",
  },
  {
    name: "Dark Mode",
    bgColor: "#242A38",
    fgColor: "#4ECDC4",
    cornerSquareColor: "#7E69F3",
    cornerDotColor: "#4ECDC4",
  },
];

// Template options with branding
const TEMPLATES = [
  {
    name: "Basic",
    description: "Clean QR code without additional branding",
    hasFrame: false,
  },
  {
    name: "Framed",
    description: "QR code with a simple branded frame",
    hasFrame: true,
    bgColor: "#FFFFFF",
    borderColor: "#3BCEAC",
  },
  {
    name: "Conference",
    description: "QR code styled for conference badges",
    hasFrame: true,
    bgColor: "#F7F9FC",
    borderColor: "#6A67CE",
    showText: true,
  },
  {
    name: "Premium",
    description: "QR code with gradient background and logo",
    hasFrame: true,
    bgColor: "linear-gradient(135deg, #3BCEAC 0%, #6A67CE 100%)",
    borderColor: "#FFFFFF",
    textColor: "#FFFFFF",
    showText: true,
    showLogo: true,
  },
];

const QRCodeGeneratorPage: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState("https://microbial.app");
  const [showSignup, setShowSignup] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [size, setSize] = useState(200);
  const [copied, setCopied] = useState(false);
  const [customText, setCustomText] = useState("Scan to join Microbial");
  const [includeEventDate, setIncludeEventDate] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"style" | "template">("style");

  // Create QR code URL that will open signup modal when scanned
  const qrCodeUrl = showSignup ? `${baseUrl}?signup=true` : baseUrl;

  // Handle URL copy
  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrCodeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download QR code as SVG
  const downloadQRCodeSVG = () => {
    if (!qrCodeRef.current) return;

    const svgElement = qrCodeRef.current.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `microbial-qrcode-${QR_CODE_STYLES[
      selectedStyle
    ].name.toLowerCase()}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  // Download QR code as PNG
  const downloadQRCodePNG = () => {
    if (!qrCodeRef.current) return;

    // For template-based QR codes, we need to capture the whole container
    const container = qrCodeRef.current;

    // Use html2canvas to capture the entire container
    import("html2canvas").then(({ default: html2canvas }) => {
      html2canvas(container, {
        scale: 2, // Higher scale for better quality
        backgroundColor: null,
        logging: false,
      }).then((canvas) => {
        // Convert to PNG
        const pngUrl = canvas.toDataURL("image/png");

        // Download
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `microbial-qrcode-${TEMPLATES[
          selectedTemplate
        ].name.toLowerCase()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      });
    });
  };

  // Render the appropriate QR code based on template selection
  const renderQRCodeTemplate = () => {
    const template = TEMPLATES[selectedTemplate];
    const style = QR_CODE_STYLES[selectedStyle];

    // Basic template (just the QR code)
    if (selectedTemplate === 0) {
      return (
        <div className="flex justify-center items-center p-4">
          <QRCodeSVG
            value={qrCodeUrl}
            size={size}
            bgColor={style.bgColor}
            fgColor={style.fgColor}
            level="H"
            includeMargin={false}
          />
        </div>
      );
    }

    // Framed template
    if (selectedTemplate === 1) {
      return (
        <div
          className="p-6 rounded-lg flex flex-col items-center"
          style={{
            backgroundColor: template.bgColor,
            border: `4px solid ${template.borderColor}`,
            borderRadius: "12px",
          }}
        >
          <QRCodeSVG
            value={qrCodeUrl}
            size={size}
            bgColor={style.bgColor}
            fgColor={style.fgColor}
            level="H"
            includeMargin={false}
          />
        </div>
      );
    }

    // Conference template
    if (selectedTemplate === 2) {
      return (
        <div
          className="p-6 rounded-lg flex flex-col items-center"
          style={{
            backgroundColor: template.bgColor,
            border: `4px solid ${template.borderColor}`,
            borderRadius: "12px",
            maxWidth: size + 100,
          }}
        >
          <div className="mb-3 text-center w-full">
            <h3 className="font-bold text-charcoal text-lg">Microbial</h3>
            {includeEventDate && eventDate && (
              <p className="text-xs text-gray-600 mb-1">{eventDate}</p>
            )}
            {eventLocation && (
              <p className="text-xs text-gray-600">{eventLocation}</p>
            )}
          </div>

          <QRCodeSVG
            value={qrCodeUrl}
            size={size}
            bgColor={style.bgColor}
            fgColor={style.fgColor}
            level="H"
            includeMargin={false}
          />

          {customText && (
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-700">{customText}</p>
            </div>
          )}
        </div>
      );
    }

    // Premium template
    if (selectedTemplate === 3) {
      return (
        <div
          className="p-8 rounded-lg flex flex-col items-center"
          style={{
            background: template.bgColor,
            border: `4px solid ${template.borderColor}`,
            borderRadius: "16px",
            maxWidth: size + 160,
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div className="mb-4 text-center w-full">
            <h3
              className="font-bold text-xl mb-1"
              style={{ color: template.textColor }}
            >
              Microbial
            </h3>
            {includeEventDate && eventDate && (
              <p
                className="text-sm mb-1 opacity-90"
                style={{ color: template.textColor }}
              >
                {eventDate}
              </p>
            )}
            {eventLocation && (
              <p
                className="text-sm opacity-90"
                style={{ color: template.textColor }}
              >
                {eventLocation}
              </p>
            )}
          </div>

          <div
            className="bg-white p-4 rounded-lg shadow-lg"
            style={{ padding: Math.max(16, size * 0.08) }}
          >
            <QRCodeSVG
              value={qrCodeUrl}
              size={size}
              bgColor={style.bgColor}
              fgColor={style.fgColor}
              level="H"
              includeMargin={false}
            />
          </div>

          {customText && (
            <div className="mt-4 text-center">
              <p className="font-medium" style={{ color: template.textColor }}>
                {customText}
              </p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAuthModalOpen={() => {}} />

      <div className="max-w-6xl mx-auto pt-8 pb-16 px-4">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-mint text-white px-6 py-4">
            <h1 className="text-2xl font-bold">Microbial QR Code Generator</h1>
            <p className="mt-1 text-white/90">
              Create branded QR codes for your conferences and events
            </p>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* QR Code Preview */}
              <div className="flex flex-col items-center justify-center">
                <div
                  ref={qrCodeRef}
                  className="rounded-lg flex justify-center items-center p-4 bg-gray-50"
                >
                  {renderQRCodeTemplate()}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={downloadQRCodeSVG}
                    className="px-4 py-2 bg-mint text-white rounded-lg hover:bg-mint/90 transition flex items-center"
                  >
                    <FaDownload className="mr-2" /> SVG
                  </button>
                  <button
                    onClick={downloadQRCodePNG}
                    className="px-4 py-2 bg-purple text-white rounded-lg hover:bg-purple/90 transition flex items-center"
                  >
                    <FaDownload className="mr-2" /> PNG
                  </button>
                </div>
              </div>

              {/* Controls */}
              <div>
                {/* Base settings */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QR Code URL
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-mint"
                      placeholder="https://microbial.app"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="bg-gray-100 px-3 rounded-r-lg flex items-center hover:bg-gray-200"
                    >
                      {copied ? (
                        <FaCheck className="text-green-500" />
                      ) : (
                        <FaClipboard className="text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <input
                      type="checkbox"
                      checked={showSignup}
                      onChange={() => setShowSignup(!showSignup)}
                      className="mr-2 h-4 w-4 accent-mint"
                    />
                    Auto-open signup modal when scanned
                  </label>
                  <p className="text-sm text-gray-500">
                    When enabled, the QR code will direct users to open the
                    signup form automatically.
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size
                  </label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="100"
                      max="300"
                      value={size}
                      onChange={(e) => setSize(parseInt(e.target.value))}
                      className="w-full accent-mint"
                    />
                    <span className="ml-2 text-sm text-gray-500 min-w-12 text-right">
                      {size}px
                    </span>
                  </div>
                </div>

                {/* Tabs for styles and templates */}
                <div className="border-b border-gray-200 mb-4">
                  <div className="flex space-x-8">
                    <button
                      onClick={() => setActiveTab("style")}
                      className={`py-2 px-1 font-medium text-sm border-b-2 ${
                        activeTab === "style"
                          ? "border-mint text-mint"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      } flex items-center`}
                    >
                      <FaPalette className="mr-2" /> QR Code Style
                    </button>
                    <button
                      onClick={() => setActiveTab("template")}
                      className={`py-2 px-1 font-medium text-sm border-b-2 ${
                        activeTab === "template"
                          ? "border-mint text-mint"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      } flex items-center`}
                    >
                      <FaImage className="mr-2" /> Design Template
                    </button>
                  </div>
                </div>

                {/* Style tab content */}
                {activeTab === "style" && (
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-2">
                      {QR_CODE_STYLES.map((style, index) => (
                        <div
                          key={style.name}
                          onClick={() => setSelectedStyle(index)}
                          className={`
                            cursor-pointer p-3 rounded-lg border-2 flex items-center 
                            ${
                              selectedStyle === index
                                ? "border-mint"
                                : "border-transparent hover:border-gray-200"
                            }
                          `}
                        >
                          <div
                            className="w-8 h-8 mr-2 rounded"
                            style={{ backgroundColor: style.fgColor }}
                          ></div>
                          <span className="text-sm font-medium">
                            {style.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Template tab content */}
                {activeTab === "template" && (
                  <div>
                    <div className="mb-6">
                      <div className="grid grid-cols-1 gap-2">
                        {TEMPLATES.map((template, index) => (
                          <div
                            key={template.name}
                            onClick={() => setSelectedTemplate(index)}
                            className={`
                              cursor-pointer p-3 rounded-lg border-2 flex items-center 
                              ${
                                selectedTemplate === index
                                  ? "border-mint"
                                  : "border-transparent hover:border-gray-200"
                              }
                            `}
                          >
                            <div
                              className="w-10 h-10 mr-3 rounded flex items-center justify-center"
                              style={{
                                background:
                                  typeof template.bgColor === "string"
                                    ? template.bgColor
                                    : "#FFFFFF",
                                border: template.hasFrame
                                  ? `2px solid ${template.borderColor}`
                                  : "none",
                              }}
                            >
                              <div className="w-6 h-6 bg-gray-700 rounded"></div>
                            </div>
                            <div>
                              <span className="text-sm font-medium block">
                                {template.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {template.description}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Template-specific options */}
                    {selectedTemplate >= 2 && (
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h3 className="font-medium text-gray-700 mb-3">
                          Template Options
                        </h3>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Custom Text
                          </label>
                          <input
                            type="text"
                            value={customText}
                            onChange={(e) => setCustomText(e.target.value)}
                            placeholder="Scan to join Microbial"
                            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-mint"
                          />
                        </div>

                        <div className="mb-4">
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                            <input
                              type="checkbox"
                              checked={includeEventDate}
                              onChange={() =>
                                setIncludeEventDate(!includeEventDate)
                              }
                              className="mr-2 h-4 w-4 accent-mint"
                            />
                            Include Event Date
                          </label>

                          {includeEventDate && (
                            <input
                              type="text"
                              value={eventDate}
                              onChange={(e) => setEventDate(e.target.value)}
                              placeholder="August 15-17, 2024"
                              className="w-full mt-2 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-mint"
                            />
                          )}
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Event Location
                          </label>
                          <input
                            type="text"
                            value={eventLocation}
                            onChange={(e) => setEventLocation(e.target.value)}
                            placeholder="Lagos, Nigeria"
                            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-mint"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg mt-6">
                  <h3 className="font-medium text-gray-700 mb-2">
                    Instructions
                  </h3>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal pl-4">
                    <li>Customize your QR code using the options above</li>
                    <li>Download your QR code in SVG or PNG format</li>
                    <li>
                      Use the QR code on printed materials or digital displays
                    </li>
                    <li>
                      When scanned, users will be directed to the Microbial
                      platform
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGeneratorPage;
