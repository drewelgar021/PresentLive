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
    contents: string,
    public_code?: string
}

export type Public = {
    id: string,
    public_code: string
    model: string,
    viewers: { name: string, datetime: Date }[]
}

export type Poll = {
    name: string,
    options: string[],
    responses: { responder: string, selection: string }[]
}
