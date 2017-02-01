class Deck {
    constructor(id, name) {
        this._orig_name = name;
        this.id = id;
        this.name = name;
    }
    /**
     * _APIUrl - get the API URL string for decks.
     *
     * @return {string}  The API URL string prefixed with a '/'.
     */
    static _APIUrl() {
        return '/api/deck';
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
            url: Deck._APIUrl() + path,
            data: JSON.stringify(data),
            contentType: 'application/json',
        });
    }
    /**
     * Load - loads a deck of the given name from the database using the JSON
     * API.
     *
     * @param  {string}          name The name of the Deck to load.
     * @return {jquery.Deferred}      A $.Deferred object.
     */
    static Load(name) {
        let result = new $.Deferred();
        Deck._AJAX('GET', '/' + name)
            .done(function(response) {
                // Make the list of cards.
                let cards = [];
                // for (let card of response.included) {
                //     cards.push(new Card(
                //         Integer.parseInt(card.id),
                //         card.relationships.field_values.data,
                //         this,
                //         new CardType()
                //     ))
                // }
                console.log(response);

                result.resolve(new Deck(response.id, response.name));
            })
            .fail(function(jqXHR) {
                result.reject(jqXHR);
            });
        return result;
    }

    static LoadAll() {
        let result = new $.Deferred();
        Deck._AJAX('GET', '')
            .done(function(response) {
                let decks = [];
                for (let deck of response.objects) {
                    decks.push(new Deck(deck.id, deck.name));
                }

                result.resolve(decks);
            })
            .fail(function(jqXHR) {
                result.reject(jqXHR);
            });
        return result;
    }

    /**
     * New - makes a new deck with the given name and saves it to the
     *       database using the JSON API.
     *
     * @param  {string}          name The name of the new deck.
     * @return {jQuery.Deferred}      A $.Deferred object.
     */
    static New(name) {
        let result = new $.Deferred();
        Deck._AJAX('POST', '', {
                name: name,
            })
            .done(function(response) {
                result.resolve(new Deck(response.id, response.name));
            })
            .fail(function(jqXHR) {
                result.reject(jqXHR.responseJSON);
            });
        return result;
    }

    /**
     * Delete - delete the deck with the given name from the database using the
     *          JSON API.
     *
     * @param  {string}          name The name of the deck to delete.
     * @return {jQuery.Deferred}      A $.Deferred object.
     */
    static Delete(name) {
        let result = new $.Deferred();
        Deck._AJAX('DELETE', '/' + name)
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
        Deck._AJAX('PUT', '/' + this._orig_name, {
                name: this.name
            })
            .done(function(response) {
                this._orig_name = this.name;
                result.resolve();
            })
            .fail(function(jqXHR) {
                // If the name has changed, this might be why. Let's assume it
                // is the case for now.
                if (this._orig_name != this.name) {
                    this._orig_name = this.name;
                    result.resolve();
                    return;
                }
                result.reject(jqXHR.responseJSON);
            });
        return result;
    }

    GetCards() {
        return Card.LoadCardsIn(this.name);
    }

    AddCard(card_type) {
        let result = new $.Deferred();
        Card.New(this, card_type)
            .done(function(card) {
                result.resolve();
            })
            .fail(function(response) {
                result.reject(response)
            });

        return result;
    }
};
