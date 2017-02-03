// We can generate a list of decks before the page has loaded.
let DECKS = [];
let _decks_loading = Deck.LoadAll()
    .done(function(decks) {
        DECKS = decks;
    });

$(function() {
    _decks_loading.always(function() {
        MakeObjectList($('#decks'), DECKS, 'name', function(deck) {
            return Deck.Delete(deck.name);
        }, function(deck, new_name) {
            deck.name = new_name;
            return deck.Save();
        }, function(deck) {
            window.location.href = `/deck/${deck.name}`;
        }, function(new_name) {
            return Deck.New(new_name);
        });
    });
});
