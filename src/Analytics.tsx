import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Public, PresentMD, Alert } from "./types.tsx"
import { useParams } from "react-router-dom";

const API = "https://comp2140-3ea651da.uqcloud.net/api";

function Analytics() {
    const [loadCode, setloadCode] = useState<string>("");
    const [privatePresentation, setprivatePresentation] = useState<PresentMD>();
    const [publicPresentation, setpublicPresentation] = useState<Public>();
    const [alert, setalert] = useState<Alert>({ hidden: true, type: "dark", message: <></> });
    const [showInfo, setshowInfo] = useState<boolean>(false);
    const [showViewers, setshowViewers] = useState<boolean>(false);
    const [showResponseVec, setshowResponseVec] = useState<{ [index: number]: boolean }>({});

    const { code: urlCode } = useParams<{ code?: string }>();
    useEffect(() => {
        if (urlCode) {
            getPresentation(urlCode);
        }
    }, [urlCode]);

    async function getPresentation(code: string) {
        const privateResponse = await fetch(`${API}/presentmd?code=${code}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
                }
            }
        ).then((response) => response.ok ?
            response.json() :
            Promise.reject(new Error(response.statusText ?? "Unknown error."))
        ).catch((error) => console.error(error.message));

        if (!privateResponse) {
            setalert({ hidden: false, type: "danger",
                message: <><b>Error:</b> Could not fetch presentation.
                            Please check API status.</>});
            return;
        }

        if (privateResponse.total == 0) {
            setalert({ hidden: false, type: "danger",
                message: <><b>Error:</b> No presentation corresponding to provided code.</>
            });
            return;
        }

        setalert({ ...alert, hidden: true });

        setprivatePresentation(privateResponse.data[0]);

        const publicResponse = await fetch(
            `${API}/public?public_code=${privateResponse.data[0].public_code}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
                }
            }
        ).then((response) => response.ok ?
            response.json() :
            Promise.reject(new Error(response.statusText ?? "Unknown error."))
        ).catch((error) => console.error(error.message));

        if (!publicResponse) {
            setalert({ hidden: false, type: "warning",
                message: <><b>Warning:</b> Could not fetch public presentation entity.
                        Poll responses and viewer information is currently unavailable.</>
            });
            return;
        }

        if (publicResponse.total == 0) {
            return;
        }

        setpublicPresentation(publicResponse.data[0]);
    }

    function togglePresentationInfo() {
        setshowInfo(!showInfo);
    }

    function toggleViewers() {
        setshowViewers(!showViewers);
    }

    function exit() {
        setprivatePresentation(undefined);
        setpublicPresentation(undefined);
        setalert({ ...alert, hidden: true });
        setshowInfo(false);
    }

    /**
     * Shows individual responses in a table for a poll.
     *
     * @param index - The index of the poll in publicPresentation.polls for which to show responses.
     */
    function showResponses(index: number) {
        const current = showResponseVec[index] ?? false;
        setshowResponseVec({ ...showResponseVec, [index]: !current });
    }

    return <div className="px-4">
        {privatePresentation &&
            <div className="d-flex justify-content-center align-items-center mt-3">
                <Button variant="outline" className="rounded p-3" onClick={() => exit()}>
                    Exit
                </Button>
            </div>
        }
        <div className="d-flex align-items-center justify-content-center">
            <div className={`alert alert-${alert.type} mt-3`} hidden={alert.hidden}>
                {alert.message}
            </div>
        </div>

        {!privatePresentation && <>
            <div className="d-flex justify-content-center align-items-center mt-3">
                <label>Presentation Code:</label>
                <Input className="mx-2" style={{maxWidth: "140px"}} placeholder="Code"
                        value={loadCode} onChange={(e) => setloadCode(e.target.value)} />
            </div>
            <div className="d-flex justify-content-center align-items-center mt-3">
                <Button variant="outline" className="rounded p-3"
                        onClick={() => getPresentation(loadCode)}>
                    Load Analytics
                </Button>
            </div>
        </>
        }
        <div className="d-flex align-items-center justify-content-center mt-3 flex-column">
            {publicPresentation && <>
                <h1>{publicPresentation.model.title ?? "Untitled Presentation"}</h1>
                <p>{publicPresentation.viewers.length} viewers</p>
                {privatePresentation && // should always be true, stops tsls from crying
                    <p>Last modified {new Date(privatePresentation.updated_at).toString()}</p>
                }
            </>}
            {privatePresentation && !publicPresentation && <h1>Private Presentation</h1>}
        </div>
        {privatePresentation && <>
            <div className="d-flex align-items-center justify-content-center mt-3">
                <Button variant="outline" className="rounded p-3"
                        onClick={() => togglePresentationInfo()}>
                    Show Presentation Info
                </Button>
            </div>

            {showInfo &&
                <div className="d-flex align-items-center justify-content-center mt-3">
                    <table className="table table-bordered"><tbody>
                        <tr>
                            <th>code</th>
                            <td>{privatePresentation.code}</td>
                        </tr>
                        <tr>
                            <th>contents</th>
                            <td className="whitespace-pre-wrap code">
                                {privatePresentation.contents}
                            </td>
                        </tr>
                    {publicPresentation && <>
                        <tr>
                            <th>public_code</th>
                            <td>{privatePresentation.public_code}</td>
                        </tr>
                        <tr>
                            <th>model</th>
                            <td className="whitespace-pre-wrap code">
                                {JSON.stringify(publicPresentation.model, null, 2)}
                            </td>
                        </tr>
                    </>}
                    </tbody></table>
                </div>
            }

            {publicPresentation && <>
                <div className="d-flex align-items-center justify-content-center mt-3">
                    <Button variant="outline" className="rounded p-3"
                            onClick={() => toggleViewers()}>
                        Show Viewer Info
                    </Button>

                </div>
                {showViewers &&
                    <div className="d-flex align-items-center justify-content-center mt-3">
                        <table className="table">
                            <thead><tr>
                                <th>Name</th>
                                <th>Time Viewed</th>
                            </tr></thead>
                            <tbody>
                                {publicPresentation.viewers.sort((v1, v2) =>  v2.datetime - v1.datetime).map((viewer) => <tr>
                                    <td>{viewer.name}</td>
                                    <td>{new Date(viewer.datetime).toString()}</td>
                                </tr>)}
                            </tbody>
                        </table>
                    </div>
                }
                <div className="d-flex align-items-center justify-content-center mt-2">
                    <h2 className="mt-3">Poll Data</h2>
                </div>
                {publicPresentation.polls.map((poll, index) =>
                    <div className="d-flex align-items-center justify-content-center mt-2
                            flex-column">
                        <h3>{poll.name}</h3>
                        <Button variant="outline" className="rounded p-3"
                                onClick={() => showResponses(index)}>
                            Show Responses
                        </Button>
                        {showResponseVec[index] &&
                            <table className="table mt-3">
                                <thead><tr>
                                    <th>Responder</th>
                                    <th>Response</th>
                                </tr></thead>
                                <tbody>
                                    {poll.responses.map((response) => <tr>
                                        <td>{response.responder}</td>
                                        <td>{response.selection}</td>
                                    </tr>)}
                                </tbody>
                            </table>
                        }
                    </div>
                )}
            </>}
        </>}
    </div>;
}

export default Analytics
