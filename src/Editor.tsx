import { useState } from "react"
import CodeEditor from "@uiw/react-textarea-code-editor"
import rehypePrism from "rehype-prism-plus";

import { presentMDToModel } from "./deckconverter.js";

import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

const PLACEHOLDER_PMD = "---\n"
                      + "title: My Presentation\n"
                      + "author: Me\n"
                      + "---\n\n"
                      + "<!-- display: title -->\n\n"
                      + "# Welcome to PresentLive!\n"

type Deck = {
    title?: string,
    author?: string,
    backgroundColor?: string,
    color?: string,
    layout?: string,
    slides?: object[]
}

function Editor() {
    const [md, setmd] = useState(PLACEHOLDER_PMD);
    const [model, setmodel] = useState(presentMDToModel(PLACEHOLDER_PMD));

    async function updatePreview(presentmd: string) {
        setmd(presentmd);
        setmodel(presentMDToModel(presentmd));
    }

    return (
        <div className="m-2">
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
                        className="mx-1 rounded"
                        style={{
                            fontFamily: "JetBrains Mono,monospace",
                            fontSize: 16,
                            borderRadius: 10
                        }}
                    />
                </Col>
                <Col>
                    <DeckPreviewer deck={model}/>
                </Col>
            </Row>
        </div>
    );
}

function DeckPreviewer(props: { deck: Deck }) {
    return <>{JSON.stringify(props.deck.slides)}</>;
}

export default Editor;
