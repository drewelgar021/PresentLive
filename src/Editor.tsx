import { useState } from "react";
import CodeEditor from "@uiw/react-textarea-code-editor";
import rehypePrism from "rehype-prism-plus";
import { AspectRatio } from "./components/ui/aspect-ratio";

import { Button } from "./components/ui/button";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

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
    slides: Slide[]
}

type Slide = {
    display?: string,
    backgroundColor?: string,
    draft?: null,
    content: object[]
}


function Editor() {
    const [md, setmd] = useState<string>(PLACEHOLDER_PMD);
    const [model, setmodel] = useState<Deck>(presentMDToModel(PLACEHOLDER_PMD));

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
    const [slideNo, setSlideNo] = useState<number>(1);
    function decrementPage() {
        if (slideNo > 1) {
            setSlideNo(slideNo - 1);
        }
    }

    function incrementPage() {
        if (slideNo < props.deck.slides.length) {
            setSlideNo(slideNo + 1);
        }
    }

    return (<>
        <AspectRatio ratio={ 16 / 9 }>
            <div className="w-full h-full overflow-hidden border border-dark rounded p-4">
                <SlideRender deck={props.deck} slideNo={slideNo - 1}/>
            </div>
        </AspectRatio>

        <div className="w-full d-flex justify-content-center align-items-center mt-3">
            <Button className="mx-2 rounded" variant="outline" size="icon" onClick={decrementPage}>
                <ArrowLeftIcon/>
            </Button>
            <span className="mx-2">{slideNo}</span>
            <Button className="mx-2 rounded" variant="outline" size="icon" onClick={incrementPage}>
                <ArrowRightIcon/>
            </Button>
        </div>
    </>);
}

function SlideRender(props: { deck: Deck, slideNo: number }) {
    return <>{JSON.stringify(props.deck.slides[props.slideNo])}</>;
}

function renderSlide(slide: Slide) {
    return <></>;
}

function parseDeck(deck: Deck) {
    return deck.slides.map((s: Slide) => renderSlide);
}



export default Editor;
