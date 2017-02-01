class Card {
    constructor(id, field_values, deck_name, card_type_name) {
        this.id = id;
        this.field_values = field_values;
        this.deck_name = deck_name
        this.card_type_name = card_type_name;
    }

    /**
     * _APIUrl - get the API URL string for cards.
     *
     * @return {string}  The API URL string prefixed with a '/'.
     */
    static _APIUrl() {
        return '/api/card';
    }

    /**
     * _AJAX - Create and return the AJAX object for a specific request.
     *
     * @param  {string}  method The API method to call.
     * @param  {object}  data   The data to send with the method.
     * @return {Promise}        A Promise-like object for the request.
     */
    static _AJAX(method, path, data) {
        return $.ajax({
            method: method,
            url: Card._APIUrl() + path,
            data: data,
            dataType: 'json',
            contentType: 'application/json',
        });
    }

    /**
     * Load - loads a card of the given name from the database using the JSON
     * API.
     *
     * @param  {int}             name The name of the card to load.
     * @return {jquery.Deferred}      A $.Deferred object.
     */
    static Load(id) {
        let result = new $.Deferred();
        Card._AJAX('GET', '/' + id)
            .done(function(response) {
                result.resolve(new Card(response.id, response.field_values));
            })
            .fail(function(jqXHR) {
                result.reject();
            });
        return result;
    }

    /**
     * LoadCardsIn - load all cards from the database with the given name.
     *
     * @param  {string}  deck_name description
     * @return {Promise}           description
     */
    static LoadCardsIn(deck_name) {
        let result = new $.Deferred();

        Card._AJAX('GET', '', {
                q: JSON.stringify({
                    filters: [{
                        name: 'deck_name',
                        op: 'eq',
                        val: deck_name,
                    }]
                })
            })
            .done(function(response) {
                let cards = [];
                for (let card of response.objects) {
                    cards.push(new Card(card.id, card.field_values, card.deck_name, card.card_type_name))
                }

                result.resolve(cards);
            })
            .fail(function(jqXHR) {
                result.reject();
            })

        return result;
    }

    /**
     * New - makes a new card with the given name and saves it to the
     *       database using the JSON API.
     *
     * @param  {string}          name The name of the new card.
     * @return {jQuery.Deferred}      A $.Deferred object.
     */
    static New(deck, card_type) {
        let result = new $.Deferred();
        Card._AJAX('POST', '', {
                card_type_name: card_type.name,
                deck_name: deck.name,
            })
            .done(function(response) {
                result.resolve(new Card(response.id, []));
            })
            .fail(function(jqXHR) {
                result.reject(jqXHR.responseJSON);
            });
        return result;
    }

    /**
     * Delete - delete the card with the given name from the database using the
     *          JSON API.
     *
     * @param  {string}          name The name of the card to delete.
     * @return {jQuery.Deferred}      A $.Deferred object.
     */
    static Delete(id) {
        let result = new $.Deferred();
        Card._AJAX('DELETE', '/' + id)
            .done(function(response) {
                result.resolve();
            })
            .fail(function(jqXHR) {
                result.reject();
            });
        return result;
    }

    /**
     * Save - saves this object back to the database using the JSON API.
     *
     * @return {jQuery.Deferred}  A jQuery deferred object.
     */
    Save() {
        let result = new $.Deferred();
        Card._AJAX('PUT', this.id, {
                field_values: this.field_values,
            })
            .done(function(response) {
                result.resolve();
            })
            .fail(function(jqXHR) {
                result.reject(jqXHR.responseJSON);
            });
        return result;
    }
};
