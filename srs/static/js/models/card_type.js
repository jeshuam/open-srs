class CardType {
    constructor(name, views, fields) {
        this._orig_name = name;
        this.name = name;
        this.views = views;
        this.fields = fields;
    }

    /**
     * _APIUrl - get the API URL string for card types.
     *
     * @return {string}  The API URL string prefixed with a '/'.
     */
    static _APIUrl() {
        return '/api/card_type';
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
            url: CardType._APIUrl() + path,
            data: JSON.stringify(data),
            contentType: 'application/json',
        });
    }

    /**
     * Load - loads a card type of the given name from the database using the JSON API.
     *
     * @param  {strin}           name The name of the card type to load.
     * @return {jquery.Deferred}      A $.Deferred object.
     */
    static Load(name) {
        let result = new $.Deferred();
        CardType._AJAX('GET', '/' + name)
            .done(function(response) {
                result.resolve(new CardType(response.name, response.views, response.fields));
            })
            .fail(function(jqXHR) {
                result.reject();
            });
        return result;
    }

    /**
     * New - makes a new card type with the given name and saves it to the
     *       database using the JSON API.
     *
     * @return {jQuery.Deferred}      A $.Deferred object.
     */
    static New(name) {
        let result = new $.Deferred();
        CardType._AJAX('POST', '', {
                name: name,
            })
            .done(function(response) {
                result.resolve(new CardType(response.name, [], []));
            })
            .fail(function(jqXHR) {
                result.reject(jqXHR.responseJSON);
            });
        return result;
    }

    /**
     * Delete - delete the card type with the given name from the database using the
     *          JSON API.
     *
     * @param  {string}          name The name of the card type to delete.
     * @return {jQuery.Deferred}      A $.Deferred object.
     */
    static Delete(name) {
        let result = new $.Deferred();
        CardType._AJAX('DELETE', '/' + name)
            .done(function(response) {
                result.resolve();
            })
            .fail(function(jqXHR) {
                result.reject();
            });
        return result;
    }

    static LoadAll() {
        let result = new $.Deferred();
        CardType._AJAX('GET', '')
            .done(function(response) {
                let card_types = [];
                for (let card_type of response.objects) {
                    card_types.push(new CardType(card_type.name, card_type.views, card_type.fields));
                }

                result.resolve(card_types);
            })
            .fail(function(jqXHR) {
                result.reject(jqXHR);
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
        let card_type = this;
        CardType._AJAX('PUT', '/' + this._orig_name, {
                name: this.name,
                views: this.views,
                fields: this.fields,
            })
            .done(function(response) {
                card_type._orig_name == card_type.name;
                result.resolve();
            })
            .fail(function(jqXHR) {
                // If we got a 404, it means the deck name changed.
                // That's not really a problem.
                if (jqXHR.status == 404) {
                    card_type._orig_name = card_type.name;
                    result.resolve();
                    return;
                }

                result.reject(jqXHR.responseJSON);
            });
        return result;
    }

    GetFieldsMap(values) {
        let fields = {};
        for (let field of this.fields) {
            if (values) {
                if (field in values) {
                    fields[field.name] = values[field];
                } else {
                    fields[field.name] = '';
                }
            } else {
                fields[field.name] = `(${field.name})`;
            }
        }

        return fields;
    }
};
