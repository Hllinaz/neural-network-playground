import "./Header.css";

const DOCUMENTATION_URL = "https://github.com/Hllinaz/neural-visualizer/wiki"

export function Header() {

    return (

        <header className="header">
            <div className="header-title">
                <h2>
                    Neural Network Visualizer
                </h2>
            </div>

            <a
                className="header-docs-link"
                href={DOCUMENTATION_URL}
                target="_blank"
                rel="noreferrer"
            >
                Documentation
            </a>
        </header>
    )
}
