import React, { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { QrCode, X, Download } from "lucide-react"

interface QrCodeButtonProps {
  url: string
  slug: string
}

export const QrCodeButton: React.FC<QrCodeButtonProps> = ({ url, slug }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleDownload = () => {
    const svgElement = document.getElementById(`qr-svg-${slug}`)
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      if (ctx) {
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        const pngFile = canvas.toDataURL("image/png")
        const downloadLink = document.createElement("a")
        downloadLink.download = `qr-${slug}.png`
        downloadLink.href = pngFile
        downloadLink.click()
      }
    }

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(true)
        }}
        className="p-1.5 rounded-md hover:bg-surface-raised text-text-muted hover:text-text-primary transition-colors"
        title="Generate QR Code"
      >
        <QrCode className="w-4 h-4 text-text-muted hover:text-accent transition-colors" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-surface border border-border rounded-xl w-full max-w-xs p-6 shadow-2xl space-y-5 text-center relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="font-display font-medium text-base text-text-primary">QR Code</h3>
              <p className="text-xs font-mono text-text-muted">{url}</p>
            </div>

            {/* QR SVG */}
            <div className="p-4 bg-white rounded-xl inline-block shadow-lg mx-auto">
              <QRCodeSVG
                id={`qr-svg-${slug}`}
                value={url}
                size={180}
                bgColor="#FFFFFF"
                fgColor="#0B0C0E"
                level="H"
              />
            </div>

            <button
              onClick={handleDownload}
              className="w-full py-2 px-4 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
