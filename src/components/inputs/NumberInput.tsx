import { useEffect, useState } from "react"

interface NumberInputProps {
    value: number
    onValueChange: (value: number) => void
    step?: string
    disabled?: boolean
}

const numericDraftPattern = /^-?\d*(?:\.\d*)?$/

export function NumberInput({
    value,
    onValueChange,
    step = "0.01",
    disabled = false
}: NumberInputProps) {
    const [draft, setDraft] = useState(formatNumber(value))
    const [isFocused, setIsFocused] = useState(false)

    useEffect(() => {
        if (!isFocused) {
            setDraft(formatNumber(value))
        }
    }, [isFocused, value])

    return (
        <input
            type="text"
            inputMode="decimal"
            pattern="-?[0-9]*[.]?[0-9]*"
            step={step}
            disabled={disabled}
            value={draft}
            onFocus={() => setIsFocused(true)}
            onChange={(event) => {
                const nextDraft = event.target.value

                if (!numericDraftPattern.test(nextDraft)) return

                setDraft(nextDraft)

                const nextValue = Number(nextDraft)

                if (nextDraft.trim() !== "" && Number.isFinite(nextValue)) {
                    onValueChange(nextValue)
                }
            }}
            onBlur={() => {
                setIsFocused(false)

                const nextValue = Number(draft)

                if (draft.trim() === "" || !Number.isFinite(nextValue)) {
                    setDraft(formatNumber(value))
                }
            }}
        />
    )
}

function formatNumber(value: number) {
    return Number.isFinite(value) ? String(value) : ""
}
