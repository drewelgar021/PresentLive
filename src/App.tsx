/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes, NavLink }
    from 'react-router-dom'
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css"

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Stack from "react-bootstrap/Stack"
import Button from "react-bootstrap/Button"

import CodeEditor from "@uiw/react-textarea-code-editor"
import rehypePrism from 'rehype-prism-plus';

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
    return (
        <div className="Editor">
            <Row>
                <Col>
                    <CodeEditor
                        language="md"
                        placeholder="Write PresentMD here"
                        value={md}
                        onChange={(e) => setmd(e.target.value)}
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
                    {md}
                </Col>
            </Row>
        </div>
    );
}

export default App
