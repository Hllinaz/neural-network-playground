import { useState } from "react"

import "./TrainingTablesModal.css"

export type TableValue = string | number
export type TableRow = Record<string, TableValue>
type TableTab = "forward" | "backward" | "parameters"

interface Props {
    forwardRows: TableRow[]
    backwardRows: TableRow[]
    parameterRows: TableRow[]
    onClose: () => void
    onDownloadForward: () => void
    onDownloadBackward: () => void
    onDownloadParameters: () => void
}

export function TrainingTablesModal({
    forwardRows,
    backwardRows,
    parameterRows,
    onClose,
    onDownloadForward,
    onDownloadBackward,
    onDownloadParameters
}: Props) {
    const [activeTab, setActiveTab] = useState<TableTab>("forward")
    const activeTable = getActiveTable(
        activeTab,
        {
            forwardRows,
            backwardRows,
            parameterRows,
            onDownloadForward,
            onDownloadBackward,
            onDownloadParameters
        }
    )

    return (
        <div className="table-modal-backdrop" role="presentation">
            <div
                className="table-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Generated training tables"
            >
                <div className="table-modal-header">
                    <div>
                        <h2>Generated Tables</h2>
                        <p>{forwardRows.length} epochs recorded</p>
                    </div>

                    <button
                        className="table-modal-close"
                        onClick={onClose}
                        aria-label="Close generated tables"
                    >
                        x
                    </button>
                </div>

                <div className="table-modal-content">
                    <div className="table-tabs" role="tablist">
                        <button
                            role="tab"
                            aria-selected={activeTab === "forward"}
                            className={activeTab === "forward" ? "active" : ""}
                            onClick={() => setActiveTab("forward")}
                        >
                            Forward
                        </button>

                        <button
                            role="tab"
                            aria-selected={activeTab === "backward"}
                            className={activeTab === "backward" ? "active" : ""}
                            onClick={() => setActiveTab("backward")}
                        >
                            Backward
                        </button>

                        <button
                            role="tab"
                            aria-selected={activeTab === "parameters"}
                            className={activeTab === "parameters" ? "active" : ""}
                            onClick={() => setActiveTab("parameters")}
                        >
                            Parameters
                        </button>
                    </div>

                    <TablePreview
                        title={activeTable.title}
                        rows={activeTable.rows}
                        onDownload={activeTable.onDownload}
                    />
                </div>
            </div>
        </div>
    )
}

interface ActiveTableConfig {
    forwardRows: TableRow[]
    backwardRows: TableRow[]
    parameterRows: TableRow[]
    onDownloadForward: () => void
    onDownloadBackward: () => void
    onDownloadParameters: () => void
}

function getActiveTable(
    activeTab: TableTab,
    config: ActiveTableConfig
) {
    switch (activeTab) {
        case "forward":
            return {
                title: "Table 1: Forward pass",
                rows: config.forwardRows,
                onDownload: config.onDownloadForward
            }

        case "backward":
            return {
                title: "Table 2: Backward pass and gradients",
                rows: config.backwardRows,
                onDownload: config.onDownloadBackward
            }

        case "parameters":
            return {
                title: "Table 3: Parameter evolution by epoch",
                rows: config.parameterRows,
                onDownload: config.onDownloadParameters
            }
    }
}

interface TablePreviewProps {
    title: string
    rows: TableRow[]
    onDownload: () => void
}

function TablePreview({
    title,
    rows,
    onDownload
}: TablePreviewProps) {
    const headers = getTableHeaders(rows)

    return (
        <section className="table-preview">
            <div className="table-preview-header">
                <h3>{title}</h3>
                <button onClick={onDownload}>Download CSV</button>
            </div>

            <div className="table-scroll">
                <table>
                    <thead>
                        <tr>
                            {headers.map(header => (
                                <th key={header}>{header}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {headers.map(header => (
                                    <td key={header}>
                                        {row[header] ?? ""}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export function getTableHeaders(rows: TableRow[]) {
    return Array.from(
        rows.reduce((columns, row) => {
            Object.keys(row).forEach(column => columns.add(column))
            return columns
        }, new Set<string>())
    )
}
