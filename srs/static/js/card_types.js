// We can generate a list of card_types before the page has loaded.
let CARD_TYPES = [];
let _card_types_loading = CardType.LoadAll()
    .done(function(card_types) {
        CARD_TYPES = card_types;
    });

$(function() {
    _card_types_loading.always(function() {
        MakeObjectList($('#card-types'), CARD_TYPES, 'name', function(card_type) {
            return CardType.Delete(card_type.name);
        }, function(card_type, new_name) {
            card_type.name = new_name;
            return card_type.Save();
        }, function(card_type) {
            window.location.href = `/card_type/${card_type.name}`;
        }, function(new_name) {
            return CardType.New(new_name);
        });
    });
});
