import { useState } from "react";
import CodeEditor from "@uiw/react-textarea-code-editor";
import rehypePrism from "rehype-prism-plus";
import { AspectRatio } from "@/components/ui/aspect-ratio";

import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

import { presentMDToModel, presentMDToJSX } from "./deckconverter";

import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

const PLACEHOLDER_PMD = "---\n"
                      + "title: My Presentation\n"
                      + "author: Me\n"
                      + "---\n\n"
                      + "<!-- layout: title -->\n\n"
                      + "# Welcome to PresentLive!\n\n"
                      + "Start writing your presentation here.\n"

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
    const [isPublic, setpublic] = useState<boolean>(false);

    async function updatePreview(presentmd: string) {
        setmd(presentmd);
        setmodel(presentMDToModel(presentmd));
    }

    function togglePublic() {
        setpublic(!isPublic);
    }

    async function postPMD() {
        return await fetch("https://comp2140-3ea651da.uqcloud.net/api/presentmd",
            {
                method: "POST",
                body: md,
                headers: {
                    Authorization: `Bearer ${import.meta.env.API_KEY}`,
                }
            }
        ).then((response) => response.ok ?
                response.json() :
                Promise.reject(new Error(response.statusText || "Unknown error."))
        ).catch((error) => console.error(error.message));

    }

    async function save() {
        console.log("saving cunt");
        console.log(postPMD());
    }

    return (
        <div className="m-2">
            <Row>
                <Col lg className="h-auto"><AspectRatio ratio={4/3}>
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
                        className="mx-1 h-full rounded rounded overflow-scroll"
                        style={{
                            fontFamily: "JetBrains Mono,monospace",
                            fontSize: 16
                        }}
                    />
                    <div className="d-flex align-items-center">
                        <Button className="mx-2 rounded" variant="outline" onClick={save}>
                            Save/Share
                        </Button>
                        <input type="checkbox" className="mx-2"
                            checked={isPublic} onChange={togglePublic}/>
                        <label>Public</label>
                    </div>
                </AspectRatio></Col>
                <Col lg>
                    <DeckPreviewer deck={model}/>
                </Col>
            </Row>
        </div>
    );
}

function DeckPreviewer(props: { deck: Deck }) {
    const [slideNo, setSlideNo] = useState<number>(1);
    const preview = presentMDToJSX(props.deck);

    if (slideNo > props.deck.slides.length) {
        setSlideNo(props.deck.slides.length);
    }

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
        <AspectRatio ratio={16/9}>
            <div className="w-full h-full overflow-hidden border border-dark rounded p-2"
                 id="viewer">
                {preview[slideNo - 1]}
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

export default Editor;
