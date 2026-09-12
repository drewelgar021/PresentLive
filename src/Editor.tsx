import { useState } from "react";
import CodeEditor from "@uiw/react-textarea-code-editor";
import rehypePrism from "rehype-prism-plus";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { customAlphabet } from "nanoid";
import { z } from "zod"

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
 
type Alert = {
    hidden: boolean,
    type: string,
    message: React.JSX.Element
}

type PresentMD = {
    id: string,
    code: string,
    contents: string
}

type Public = {
    id: string,
    private_code: string,
    public_code: string
}

const API = "https://comp2140-3ea651da.uqcloud.net/api";
const CODE_ALPHABET = "abcdefghijklmnopqrstuvwxyz1234567890";
const CODE_LENGTH = 8;

const modelResponseSchema = z.object({ pmd: z.string() });

async function fetchLLMPresentation(topic: string) {
    const data = await fetch("http://localhost:3001/api/generate-presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic })
    }).then((response) => response.ok ?
            response.json() :
            Promise.reject(new Error(response.statusText || "Unknown error."))
    ).catch((error) => {console.error(error.message); return null})

    if (!data) {
        return null;
    }

    const parsed = modelResponseSchema.safeParse(data);
    if (!parsed.success) {
        console.log("Error: Response did not match expected schema.")
        return null;
    }
    return parsed.data.pmd;
}

/**
 * Returns a unique code that can be used to load this presentation in the future.
 * Queries the API to check if the code is already used, and if so then generates another one.
 * Global constants CODE_ALPHABET and CODE_LENGTH decide the alphabet and length of the code,
 * respectively.
 *
 * @return A unique code for this presentation.
 */
async function codeGenerator() {
    const code = customAlphabet(CODE_ALPHABET, CODE_LENGTH)();
    const response = await fetch(`${API}/presentmd?code=${code}`,
        {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
            }
        }
    )
        .then((response) => response.ok ?
            response.json() :
            Promise.reject(new Error(response.statusText ?? "Unknown error.")))
        .catch((error) => console.error(error.message));

    if (!response) return null;

    if (response.total == 0) {
        return code;
    }

    return codeGenerator();
}


function Editor() {
    const [md, setmd] = useState<string>(PLACEHOLDER_PMD);
    const [loadCode, setloadCode] = useState<string>("");
    const [invalidLoad, setinvalidLoad] = useState<boolean>(false);
    const [code, setcode] = useState<string>();
    const [model, setmodel] = useState<Deck>(presentMDToModel(PLACEHOLDER_PMD));
    const [isPublic, setpublic] = useState<boolean>(false);
    const [alert, setAlert] = useState<Alert>({ hidden: true, type: "dark", message: <></> });
    const [prompt, setprompt] = useState<string>();
    const [isGenerating, setisGenerating] = useState<boolean>(false);


    async function updatePreview(presentmd: string) {
        setmd(presentmd);
        setmodel(presentMDToModel(presentmd));
    }

    function togglePublic() {
        setpublic(!isPublic);
    }


    /**
     * Loads a presentation from the API into the editor given the loadCode in state.
     * Sets the state variable invalidLoad if the load was not successful.
     */
    async function getPMD() {
        const response = await fetch(`${API}/presentmd?code=${loadCode}`,
        {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
            }
        })
        .then((response) => response.ok ?
            response.json() :
            Promise.reject(new Error(response.statusText ?? "Unknown error.")))
        .catch((error) => console.error(error.message));

        if (response.total == 0) {
            setinvalidLoad(true);
            setAlert({ hidden: false, type: "danger",
                message: <>
                    <b>Error:</b> No presentation corresponding to provided code.
                </>
            });

        } else {
            setinvalidLoad(false);
            setmd(response.data[0].contents);
            setmodel(presentMDToModel(response.data[0].contents));
            setcode(loadCode);
            setAlert({ hidden: false, type: "success",
                message: <>
                    Presentation loaded successfully!
                </>
            })
        }
    }


    async function deletePrivate(id: string) {
        await fetch(`${API}/presentmd/${id}`,
            {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}` }
        })
        .then((response) => response.ok ? {}
            : Promise.reject(new Error(response.statusText ?? "Unknown error.")))
        .catch((error) => console.error(error.message));
    }

    /**
     * Deletes all presentations from the API having the same private code as the one currently
     * loaded.
     */
    async function deletePresentation() {
        const target = await fetch (`${API}/presentmd?code=${code}`,
            {
                method: "GET",
                headers: { "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}` }
        })
        .then((response) => response.ok ?
            response.json() :
            Promise.reject(new Error(response.statusText ?? "Unknown error.")))
        .catch((error) => console.error(error.message));
        if (!target) {
            setAlert({ hidden: false, type: "danger",
                message: <><b>Error:</b> Could not connect to API.</> });
            return;
        }
        target.data.forEach((record: PresentMD) => deletePrivate(record.id));
        newPresentation();
        setAlert({ hidden: false, type: "success",
            message: <>Presentation deleted.</>})
    }

    /**
     * Sends a PUT or POST request to API/presentmd to store the current presentation.
     * If a presentation with the same code already exists, PUTs the new one.
     * Otherwise POSTs with a new, randomly generated code.
     * If a new code is generated, the code is also updated in state.
     *
     * @return The HTTP response from the API.
     * */
    async function postPMD() {
        const newCode = code ?? await codeGenerator();
        if (!newCode) {
            return null;
        }
        if (newCode != code) {
            setcode(newCode);
        }
        const body = { code: newCode, contents: md };

        const existing = await fetch (`${API}/presentmd?code=${newCode}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
                }
            })
            .then((response) => response.ok ?
                response.json() :
                Promise.reject(new Error(response.statusText ?? "Unknown error.")))
            .catch((error) => {console.error(error.message)});

        if (!existing) return null;

        if (existing.total == 0) {
            return await fetch(`${API}/presentmd`,
                {
                    method: "POST",
                    body: JSON.stringify(body),
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`,
                    }
                }
            ).then((response) => response.ok ?
                    newCode :
                    Promise.reject(new Error(response.statusText || "Unknown error."))
            ).catch((error) => {console.error(error.message); return null});
        }

        return await fetch(`${API}/presentmd/${existing.data[0].id}`,
            {
                method: "PUT",
                body: JSON.stringify(body),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`,
                }
            }
        ).then((response) => response.ok ?
                newCode :
                Promise.reject(new Error(response.statusText || "Unknown error."))
        ).catch((error) => {console.error(error.message); return null});
    }


    /**
     * Saves the current presentation to the API.
     */
    async function save() {
        const newCode = await postPMD();
        if (newCode) {
            setAlert({ hidden: false, type: "success",
                message: <>
                    Presentation saved successfully!<br/>
                    Use code <b>{newCode}</b> to pick up where you left off, or share with
                    collaborators.
                </>
            }
        )} else {
            setAlert({ hidden: false, type: "danger",
                message: <>
                    <b>Error:</b> Could not save presentation.<br/>
                    Please check API status.
                </>
            });
        }
    }

    function newPresentation(md: string = PLACEHOLDER_PMD) {
        setcode(undefined);
        setmd(md);
        setloadCode("");
        setinvalidLoad(false);
        setmodel(presentMDToModel(md));
        setpublic(false);
        setAlert({ hidden: false, type: "success",
                    message: <>New presentation created successfully</> })
    }


    async function generate() {
        setisGenerating(true);
        if (prompt && prompt.trim().length > 0) {
            const response = await fetchLLMPresentation(prompt);
            if (!response) {
                setAlert({ hidden: false, type: "danger",
                    message: <><b>Error:</b> Unable to obtain response from the AI model.</> });
            } else {
                newPresentation();
                setmd(response);
                setmodel(presentMDToModel(response));
                setAlert({ hidden: false, type: "success",
                    message: <>Presentation generated successfully!</> })
            }
        } else {
            setAlert({ hidden: false, type: "danger",
                    message: <>Please provide a topic to generate.</>});
        }
        setisGenerating(false);
    }

    return (
        <div className="m-2">
            <Row>
                <Col lg className="h-auto"><AspectRatio ratio={4/3}>
                    <Button className="rounded m-2" variant="outline"
                            onClick={() => newPresentation()}>
                        New Presentation
                    </Button>
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

                    <div className="d-flex align-items-center mt-2">
                        <Button className="mx-2 rounded" variant="outline" onClick={save}>
                            Save/Share
                        </Button>
                        <input type="checkbox" className="mx-2"
                            checked={isPublic} onChange={togglePublic}/>
                        <label>Public</label>
                        { code &&
                            <Button className="mx-2 rounded" variant="outline"
                                    onClick={deletePresentation}>
                                Delete
                            </Button>
                        }
                    </div>

                    <div className="d-flex align-items-center mt-2">
                        <Field style={{ maxWidth: "100px" }} data-invalid={invalidLoad}
                            className="mx-2">
                            <Input style={{ maxWidth: "100px" }} className="rounded"
                                placeholder="Code"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setloadCode(e.target.value);
                                    setinvalidLoad(false);
                                }} aria-invalid={invalidLoad} />
                        </Field>
                        <Button className="rounded" variant="outline" onClick={getPMD}>
                            Load
                        </Button>
                    </div>
                    <div className="d-flex align-items-center mt-2">
                        <Field style={{ maxWidth: "300px" }} className="mx-2">
                            <Input style={{ maxWidth: "300px" }} className="rounded"
                                placeholder="Write me a presentation about..."
                                onChange={(e) => setprompt(e.target.value)} />
                        </Field>
                        <Button className="rounded" variant="outline" onClick={generate}>
                            { isGenerating && <div className="spinner-grow" />}
                            Generate
                        </Button>
                    </div>

                    <div className="d-flex align-otems-center mt-2">
                        <div className={`alert alert-${alert.type}`} hidden={alert.hidden}>
                            {alert.message}
                        </div>
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
            <div className="w-full h-full overflow-hidden border border-dark rounded p-2 viewer">
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
