export type Deck = {
    title?: string,
    author?: string,
    backgroundColor?: string,
    color?: string,
    layout?: string,
    slides: Slide[]
}

export type Slide = {
    display?: string,
    backgroundColor?: string,
    draft?: null,
    poll?: string,
    options?: string,
    content: object[]
}
 
export type Alert = {
    hidden: boolean,
    type: string,
    message: React.JSX.Element
}

export type PresentMD = {
    id: string,
    code: string,
    contents: string
}

export type Public = {
    id: string,
    public_code: string
    model: string,
    viewers: string
}

export type Poll = {
    name: string,
    responses: PollResponse[]
}

type PollResponse = {
    responder: string,
    selection: string
}
