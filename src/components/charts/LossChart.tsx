import { useEffect, useRef, useState } from "react"
import {
    Download,
    FileImage,
    FileText
} from "lucide-react"
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts"

import "./LossChart.css"

export interface LossPoint {
    epoch: number
    loss: number
}

interface Props {
    data: LossPoint[]
}

type ExportFormat = "svg" | "png" | "pdf"

export function LossChart({ data }: Props) {
    const chartRef = useRef<HTMLDivElement | null>(null)
    const exportMenuRef = useRef<HTMLDivElement | null>(null)
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
    const latestLoss = data[data.length - 1]?.loss

    useEffect(() => {
        if (!isExportMenuOpen) return

        const handlePointerDown = (event: PointerEvent) => {
            if (!exportMenuRef.current?.contains(event.target as Node)) {
                setIsExportMenuOpen(false)
            }
        }

        window.addEventListener("pointerdown", handlePointerDown)

        return () => window.removeEventListener("pointerdown", handlePointerDown)
    }, [isExportMenuOpen])

    const handleExportChart = async (format: ExportFormat) => {
        const svg = chartRef.current?.querySelector("svg")

        if (!svg || data.length === 0) return

        setIsExportMenuOpen(false)

        const exportableSvg = createExportableSvg(svg)

        if (format === "svg") {
            downloadBlob(
                "loss_chart.svg",
                new Blob([exportableSvg.text], {
                    type: "image/svg+xml;charset=utf-8"
                })
            )
            return
        }

        const canvas = await svgToCanvas(exportableSvg.text, exportableSvg.width, exportableSvg.height)

        if (format === "png") {
            const blob = await canvasToBlob(canvas, "image/png")

            downloadBlob("loss_chart.png", blob)
            return
        }

        const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.95)

        downloadBlob(
            "loss_chart.pdf",
            createPdfFromJpeg(jpegDataUrl, canvas.width, canvas.height)
        )
    }

    return (
        <section className="loss-chart-panel">
            <div className="loss-chart-header">
                <h2>Loss</h2>
                <div className="loss-chart-actions">
                    <span>
                        {latestLoss === undefined
                            ? "Epoch 0"
                            : `Epoch ${data.length} · ${formatLoss(latestLoss)}`}
                    </span>
                    <div className="loss-chart-export" ref={exportMenuRef}>
                        <button
                            type="button"
                            className="loss-chart-download"
                            aria-label="Open loss chart export menu"
                            title="Export loss chart"
                            aria-expanded={isExportMenuOpen}
                            disabled={data.length === 0}
                            onClick={() => setIsExportMenuOpen(current => !current)}
                        >
                            <Download aria-hidden="true" size={15} strokeWidth={2.4} />
                        </button>

                        {isExportMenuOpen && (
                            <div className="loss-chart-export-menu" role="menu">
                                <button type="button" role="menuitem" onClick={() => handleExportChart("svg")}>
                                    <FileText aria-hidden="true" size={14} strokeWidth={2.2} />
                                    SVG
                                </button>
                                <button type="button" role="menuitem" onClick={() => handleExportChart("png")}>
                                    <FileImage aria-hidden="true" size={14} strokeWidth={2.2} />
                                    PNG
                                </button>
                                <button type="button" role="menuitem" onClick={() => handleExportChart("pdf")}>
                                    <FileText aria-hidden="true" size={14} strokeWidth={2.2} />
                                    PDF
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="loss-chart-body" ref={chartRef}>
                {data.length === 0 ? (
                    <div className="loss-chart-empty">
                        No epochs yet
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{
                                top: 8,
                                right: 12,
                                bottom: 0,
                                left: 6
                            }}
                        >
                            <CartesianGrid
                                stroke="#e5e7eb"
                                strokeDasharray="3 3"
                            />
                            <XAxis
                                dataKey="epoch"
                                tick={{ fontSize: 11, fill: "#64748b" }}
                                tickLine={false}
                                axisLine={{ stroke: "#cbd5e1" }}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: "#64748b" }}
                                tickLine={false}
                                axisLine={{ stroke: "#cbd5e1" }}
                                width={58}
                                tickFormatter={formatLoss}
                            />
                            <Tooltip
                                formatter={(value) => [
                                    formatLoss(Number(value)),
                                    "Loss"
                                ]}
                                labelFormatter={(value) => `Epoch ${value}`}
                            />
                            <Line
                                type="monotone"
                                dataKey="loss"
                                stroke="#2563eb"
                                strokeWidth={2}
                                dot={{ r: 3, fill: "#2563eb" }}
                                activeDot={{ r: 5 }}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </section>
    )
}

function createExportableSvg(svg: SVGSVGElement) {
    const clone = svg.cloneNode(true) as SVGSVGElement
    const { width, height } = svg.getBoundingClientRect()
    const exportWidth = Math.ceil(width)
    const exportHeight = Math.ceil(height)

    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    clone.setAttribute("width", String(exportWidth))
    clone.setAttribute("height", String(exportHeight))
    clone.setAttribute("viewBox", `0 0 ${exportWidth} ${exportHeight}`)

    const background = document.createElementNS("http://www.w3.org/2000/svg", "rect")
    background.setAttribute("width", "100%")
    background.setAttribute("height", "100%")
    background.setAttribute("fill", "#ffffff")
    clone.insertBefore(background, clone.firstChild)

    return {
        text: new XMLSerializer().serializeToString(clone),
        width: exportWidth,
        height: exportHeight
    }
}

function svgToCanvas(svgText: string, width: number, height: number) {
    const scale = 2
    const svgBlob = new Blob([svgText], {
        type: "image/svg+xml;charset=utf-8"
    })
    const url = URL.createObjectURL(svgBlob)

    return new Promise<HTMLCanvasElement>((resolve, reject) => {
        const image = new Image()

        image.onload = () => {
            const canvas = document.createElement("canvas")
            const context = canvas.getContext("2d")

            if (!context) {
                URL.revokeObjectURL(url)
                reject(new Error("Canvas context unavailable"))
                return
            }

            canvas.width = width * scale
            canvas.height = height * scale

            context.fillStyle = "#ffffff"
            context.fillRect(0, 0, canvas.width, canvas.height)
            context.drawImage(image, 0, 0, canvas.width, canvas.height)

            URL.revokeObjectURL(url)
            resolve(canvas)
        }

        image.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error("Unable to render chart image"))
        }

        image.src = url
    })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string) {
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob)
                return
            }

            reject(new Error("Unable to export chart"))
        }, type)
    })
}

function downloadBlob(fileName: string, blob: Blob) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = fileName
    link.click()

    URL.revokeObjectURL(url)
}

function createPdfFromJpeg(dataUrl: string, width: number, height: number) {
    const imageBytes = base64ToBytes(dataUrl.split(",")[1])
    const content = `q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ`
    const encoder = new TextEncoder()
    const parts: Array<string | Uint8Array<ArrayBuffer>> = []
    const offsets: number[] = []
    let byteLength = 0

    const append = (part: string | Uint8Array<ArrayBuffer>) => {
        parts.push(part)
        byteLength += typeof part === "string"
            ? encoder.encode(part).byteLength
            : part.byteLength
    }

    const appendObject = (id: number, body: string | Uint8Array<ArrayBuffer>, prefix = "", suffix = "") => {
        offsets[id] = byteLength
        append(`${id} 0 obj\n${prefix}`)
        append(body)
        append(`${suffix}\nendobj\n`)
    }

    append("%PDF-1.4\n")
    appendObject(1, "<< /Type /Catalog /Pages 2 0 R >>")
    appendObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    appendObject(
        3,
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`
    )
    appendObject(
        4,
        imageBytes,
        `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.byteLength} >>\nstream\n`,
        "\nendstream"
    )
    appendObject(
        5,
        content,
        `<< /Length ${encoder.encode(content).byteLength} >>\nstream\n`,
        "\nendstream"
    )

    const xrefOffset = byteLength
    append(`xref\n0 6\n0000000000 65535 f \n`)

    for (let id = 1; id <= 5; id += 1) {
        append(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`)
    }

    append(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`)

    return new Blob(parts, {
        type: "application/pdf"
    })
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
    const binary = window.atob(base64)
    const bytes = new Uint8Array(new ArrayBuffer(binary.length))

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
    }

    return bytes
}

function formatLoss(value: number) {
    if (Math.abs(value) >= 100) {
        return value.toFixed(1)
    }

    if (Math.abs(value) >= 1) {
        return value.toFixed(3)
    }

    return value.toFixed(5)
}
