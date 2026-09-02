import { useState } from "react"
//import { BrowserRouter as Router, Route, Routes, NavLink }
import { BrowserRouter as Router }
    from "react-router-dom"
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css"

import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"

import CodeEditor from "@uiw/react-textarea-code-editor"
import rehypePrism from "rehype-prism-plus";

import { presentMDToModel } from "./deckconverter.js";

const PLACEHOLDER_PMD = "---\n"
                      + "title: My Presentation\n"
                      + "author: Me\n"
                      + "---\n\n"
                      + "<!-- display: title -->\n\n"
                      + "# Welcome to PresentLive!\n"


function App() {

    return (
        <Router><div className="App">
            <header>
                <h1>PresentLive</h1>
            </header>

            <Editor/>
        </div></Router>
    );
}

function Editor() {
    const [md, setmd] = useState(PLACEHOLDER_PMD);
    const [odf, setodf] = useState(JSON.stringify(presentMDToModel(PLACEHOLDER_PMD)));

    function updatePreview(presentmd: string) {
        setmd(presentmd);
        setodf(JSON.stringify(presentMDToModel(presentmd)));
    }

    return (
        <div className="Editor">
            <Row>
                <Col>
                    <CodeEditor
                        language="md"
                        placeholder="Write PresentMD here"
                        value={md}
                        onChange={(e) => updatePreview(e.target.value)}
                        padding={15}
                        rehypePlugins={[
                            [rehypePrism, {
                                ignoreMissing: true, showLineNumbers: true
                            }]
                        ]}
                        style={{
                            fontFamily: "JetBrains Mono,monospace",
                            fontSize: 16,
                            borderRadius: 10,
                        }}
                    />
                </Col>
                <Col>
                    {odf}
                </Col>
            </Row>
        </div>
    );
}

export default App
