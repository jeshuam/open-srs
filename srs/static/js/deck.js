function MakeCardDiv(card) {
    let template = `<li>${card.id}</li>`;
    return $(template);
};

$(function() {
    // Load all cards for this deck.
    let $cards_div = $('#cards');
    Card.LoadCardsIn(DECK_NAME)
        .done(function(cards) {
            let $cards_list = $('<ul>');
            for (let card of cards) {
                $cards_list.append(MakeCardDiv(card));
            }

            $cards_div.append($cards_list);
        });
});
