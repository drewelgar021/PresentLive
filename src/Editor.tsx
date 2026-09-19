import { useEffect, useState } from "react";
import CodeEditor from "@uiw/react-textarea-code-editor";
import rehypePrism from "rehype-prism-plus";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { customAlphabet } from "nanoid";
import { z } from "zod"
import { useParams } from "react-router-dom";

import { presentMDToModel, presentMDToJSX } from "./deckconverter";

import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import type { Deck, Alert, PresentMD, Public, Poll } from "./types"

const PLACEHOLDER_PMD = "---\n"
                      + "title: My Presentation\n"
                      + "author: Me\n"
                      + "---\n\n"
                      + "<!-- layout: title -->\n\n"
                      + "# Welcome to PresentLive!\n\n"
                      + "Start writing your presentation here.\n"

const API = "https://comp2140-3ea651da.uqcloud.net/api";
const CODE_ALPHABET = "abcdefghijklmnopqrstuvwxyz1234567890";

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
    const code = customAlphabet(CODE_ALPHABET, 8)();
    const response = await fetch(`${API}/presentmd?code=${code}`,
        {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
            }
        }).then((response) => response.ok ?
            response.json() :
            Promise.reject(new Error(response.statusText ?? "Unknown error.")))
        .catch((error) => console.error(error.message));

    if (!response) return null;

    if (response.total == 0) {
        return code;
    }

    return codeGenerator();
}

/**
 * Returns a unique code that can be used to load this presentation in the future.
 * Queries the API to check if the code is already used, and if so then generates another one.
 * Global constants CODE_ALPHABET and CODE_LENGTH decide the alphabet and length of the code,
 * respectively.
 *
 * @return A unique code for this presentation.
 */
async function publicCodeGenerator() {
    const code = customAlphabet(CODE_ALPHABET, 6)();
    const response = await fetch(`${API}/public?public_code=${code}`,
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

    if (!response) return undefined;

    if (response.total == 0) {
        return "w-" + code;
    }

    return publicCodeGenerator();
}



function Editor() {
    const [md, setmd] = useState<string>(PLACEHOLDER_PMD);
    const [loadCode, setloadCode] = useState<string>("");
    const [invalidLoad, setinvalidLoad] = useState<boolean>(false);
    const [code, setcode] = useState<string>();
    const [publicCode, setpublicCode] = useState<string>();
    const [model, setmodel] = useState<Deck>(presentMDToModel(PLACEHOLDER_PMD));
    const [isPublic, setpublic] = useState<boolean>(false);
    const [alert, setAlert] = useState<Alert>({ hidden: true, type: "dark", message: <></> });
    const [prompt, setprompt] = useState<string>();
    const [isGenerating, setisGenerating] = useState<boolean>(false);

    const { code: urlCode } = useParams<{ code?: string }>();
    useEffect(() => {
        if (urlCode) {
            getPMD(urlCode);
        }
    }, [urlCode]);


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
    async function getPMD(code: string) {
        const response = await fetch(`${API}/presentmd?code=${code}`,
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
            setcode(code);
            setpublicCode(response.data[0].public_code);
            setpublic(response.data[0].public_code ? true : false);
            setAlert({ hidden: false, type: "success",
                message: <>
                    Presentation loaded successfully!
                </>
            })
        }
    }

    /**
     * Deletes a presentation from the API's presentmd entity.
     *
     * @param id - The id of the record to be deleted.
     *             This is the uuid automatically assigned by the API, not the code.
     */
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
     * Deletes a presentation from the API's public entity.
     *
     * @param id - The id of the record to be deleted.
     *             This is the uuid automatically assigned by the API, not the public_code.
     */
    async function deletePublic(id: string) {
        await fetch(`${API}/public/${id}`,
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
        const privateTarget = await fetch (`${API}/presentmd?code=${code}`,
            {
                method: "GET",
                headers: { "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}` }
        })
        .then((response) => response.ok ?
            response.json() :
            Promise.reject(new Error(response.statusText ?? "Unknown error.")))
        .catch((error) => console.error(error.message));
        if (!privateTarget) {
            setAlert({ hidden: false, type: "danger",
                message: <><b>Error:</b> Could not connect to API.</> });
            return;
        }
        privateTarget.data.forEach((record: PresentMD) => deletePrivate(record.id));

        const publicTarget= await fetch (`${API}/public?public_code=${publicCode}`,
            {
                method: "GET",
                headers: { "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}` }
        })
        .then((response) => response.ok ?
            response.json() :
            Promise.reject(new Error(response.statusText ?? "Unknown error.")))
        .catch((error) => console.error(error.message));
        if (!publicTarget) {
            setAlert({ hidden: false, type: "danger",
                message: <><b>Error:</b> Could not connect to API.</> });
            return;
        }
        publicTarget.data.forEach((record: PresentMD) => deletePublic(record.id));

        newPresentation();
        setAlert({ hidden: false, type: "success",
            message: <>Presentation deleted.</>})
    }

    /**
     * Gets an array of polls from the current presentation.
     * The returned array will have no responses recorded.
     *
     * @return The array of polls.
     */
    function getPolls(): Poll[] {
        return model.slides.filter((slide) => slide.poll ? true : false)
            .map((slide) => { return {
                name: slide.poll ?? "",
                responses: []
            }});
    }

    /**
     * Sends a PUT or POST request to API/public to store a public presentation.
     * If a presentation with the same public code already exists, PUTs the new one.
     * Otherwise POSTs with a new, randomly generated code.
     * If a new code is generated, then the public code is also updated in state.
     *
     * @return The uniquely generated public code that can be used to watch a presentation without
     *         editing, or null if an error occurs.
     */
    async function postPublic(publicCode: string | undefined) {
        if (!publicCode) {
            return null;
        }
        const body = { public_code: publicCode, model: model, viewers: [], polls: []}

        const existing = await fetch (`${API}/public?public_code=${publicCode}`,
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

        if (!existing) {
            return null;
        }

        if (existing.total == 0) {
            return await fetch(`${API}/public`,
                {
                    method: "POST",
                    body: JSON.stringify({ ...body, polls: getPolls()}),
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`,
                    }
                }
            ).then((response) => response.ok ?
                    publicCode :
                    Promise.reject(new Error(response.statusText || "Unknown error."))
            ).catch((error) => {console.error(error.message); return null});
        }

        // Overwrite currently existing presentation.
        const existingPollNames: string[] = existing.data[0].polls.map((poll: Poll) => poll.name);
        const polls = [
            ...existing.data[0].polls,
            ...getPolls().filter((poll) => !(existingPollNames.includes(poll.name)))
        ];
        return await fetch(`${API}/public/${existing.data[0].id}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    ...body,
                    polls: polls,
                    viewers: existing.data[0].viewers
                }),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`,
                }
            }
        ).then((response) => response.ok ?
                publicCode :
                Promise.reject(new Error(response.statusText || "Unknown error."))
        ).catch((error) => {console.error(error.message); return null});

    }

    /**
     * Sends a PUT or POST request to API/presentmd to store the current presentation.
     * If a presentation with the same code already exists, PUTs the new one.
     * Otherwise POSTs with a new, randomly generated code.
     * If a new code is generated, the code is also updated in state.
     *
     * @return The uniquely generated presentation code that can be used to load the saved
     *         presentation into the editor.
     * */
    async function postPMD(publicCode: string | undefined) {
        const newCode = code ?? await codeGenerator();
        if (!newCode) {
            return null;
        }
        if (newCode != code) {
            setcode(newCode);
        }
        const body = { code: newCode, contents: md, public_code: publicCode };

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
        // If presentation has been switched to private, delete from public entity.
        if (!isPublic && publicCode) {
            const codes = await fetch(`${API}/public?public_code=${publicCode}`,
                {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}` }
                }
            ).then((response) => response.ok ?
                response.json() :
                Promise.reject(new Error(response.statusText || "Unknown error."))
            ).catch((error) => {console.error(error.message); return null});

            if (codes) {
                codes.data.map((record: Public) => deletePublic(record.id));
            }

        }

        // Generate a new public code if public, otherwise set to undefined.
        const newPublicCode = isPublic ?
            await postPublic(((publicCode ?? await publicCodeGenerator()))) :
            undefined;
        if (newPublicCode) {
            setpublicCode(newPublicCode);
        }

        // Post to private presentations entity and get returned code.
        const newCode = await postPMD(newPublicCode ?? undefined);

        // Private post must always be successful.
        // Public post must be successful if public.
        if (newCode && (!isPublic || newPublicCode)) {
            setAlert({ hidden: false, type: "success",
                message: <>
                    Presentation saved successfully!<br/>
                    Use code <b>{newCode}</b> to pick up where you left off, or share with
                    collaborators.
                    {newPublicCode &&
                        <><br/>Share code <b>{newPublicCode}</b> with viewers to use in the "Watch"
                            tab.</>
                    }
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
                                }} aria-invalid={invalidLoad} value={loadCode} />
                        </Field>
                        <Button className="rounded" variant="outline"
                                onClick={() => getPMD(loadCode)}>
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

                    <div className="d-flex align-items-center mt-2">
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
    const [slideNo, setslideNo] = useState<number>(1);
    const preview = presentMDToJSX(props.deck);

    if (slideNo > props.deck.slides.length) {
        setslideNo(props.deck.slides.length);
    }

    function decrementPage() {
        if (slideNo > 1) {
            setslideNo(slideNo - 1);
        }
    }

    function incrementPage() {
        if (slideNo < props.deck.slides.length) {
            setslideNo(slideNo + 1);
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
