// We can generate a list of decks before the page has loaded.
let DECKS = [];
let _decks_loading = Deck.LoadAll()
    .done(function(decks) {
        DECKS = decks;
    });

$(function() {
    _decks_loading.always(function() {
        MakeObjectList($('#decks'), DECKS, {
            name_key: 'name',
            delete: function(deck) {
                return Deck.Delete(deck.name);
            },

            edit: function(deck, new_name) {
                deck.name = new_name;
                return deck.Save();
            },

            navigate: function(deck) {
                window.location.href = `/deck/${deck.name}`;
            },

            new: function(new_name) {
                return Deck.New(new_name);
            },
        });
    });
});
