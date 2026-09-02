type Deck = {
    title?: string,
    author?: string,
    backgroundColor?: string,
    color?: string,
    layout?: string,
    slides?: object[]
}


function DeckPreviewer(props: { deck: Deck }) {
    return <>{JSON.stringify(props.deck.slides)}</>;
}

export default DeckPreviewer;
