// We can generate a list of card_types before the page has loaded.
let CARD_TYPES = [];
let _card_type_loading = CardType.LoadAll()
    .done(function(card_types) {
        CARD_TYPES = card_types;
    });

$(function() {
    _card_type_loading.always(function() {
        MakeObjectList($('#card-types'), CARD_TYPES, {
            name_key: 'name',
            delete: function(card_type) {
                return CardType.Delete(card_type.name);
            },

            edit: function(card_type, new_name) {
                card_type.name = new_name;
                return card_type.Save();
            },

            navigate: function(card_type) {
                window.location.href = `/card_type/${card_type.name}`;
            },

            new: function(new_name) {
                return CardType.New(new_name);
            },
        });
    });
});
