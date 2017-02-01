function MakeNewCardTypeInputGroup() {
    let template =
        `
<div class="input-group card-type-new">
  <input class="form-control" />
  <div class="input-group-btn">
    <button class="btn btn-success">
      <span class="glyphicon glyphicon-ok"></span>
    </button>
  </div>
</div>`

    let $new_card_type_input = $(template);
    let $submit_button = $new_card_type_input.find('.btn-success');

    $new_card_type_input.find('input')
        .keypress(function(e) {
            if (e.which == 13) {
                $submit_button.click();
            }
        });

    $submit_button.click(function() {
        let $input = $new_card_type_input.find('input');

        // Setup a loading icon...
        $new_card_type_input.find('.glyphicon-ok')
            .removeClass('glyphicon-ok')
            .addClass('glyphicon-refresh glyphicon-refresh-animate');

        // Make the new deck!
        CardType.New($input.val())
            .done(function(card_type) {
                CARD_TYPES.push(card_type);
                $('#card-types')
                    .empty();
                GenerateCardTypesDiv();
            })
            .fail(function(response) {
                if (response.message == 'IntegrityError') {
                    $new_card_type_input.addClass('has-error')
                        .find('input')
                        .tooltip({
                            placement: 'bottom',
                            title: function() {
                                return `The name "${$input.val()}" is already taken.`;
                            },
                            trigger: 'manual',
                        })
                        .tooltip('show');
                }
            })
            .always(function() {
                $new_card_type_input.find('.glyphicon')
                    .removeClass('glyphicon-refresh glyphicon-refresh-animate')
                    .addClass('glyphicon-ok');
            });
    });

    return $new_card_type_input;
}

/**
 * Generate the HTML for the given deck_name.
 *
 * @class      MakeCardTypeInputGroup (name)
 */
function MakeCardTypeInputGroup(card_type_name) {
    let template =
        `
<div class="input-group card-type">
  <div class="input-group-btn">
    <button class="btn btn-danger">
      <span class="glyphicon glyphicon-trash"></span>
    </button>
  </div>
  <button class="btn btn-success form-control">${card_type_name}</button>
  <div class="input-group-btn">
    <button class="btn btn-primary">
      <span class="glyphicon glyphicon-pencil"></span>
    </button>
  </div>
</div>`

    let $new_card_type = $(template);

    // Extract some key elements.
    let $delete_btn = $new_card_type.find('.btn-danger');
    let $edit_btn = $new_card_type.find('.btn-primary');
    let $navigate_btn = $new_card_type.find('.btn-success');

    // When the trash button is pressed, delete it.
    $delete_btn.click(function() {
        $delete_btn.find('.glyphicon-trash')
            .removeClass('glyphicon-trash')
            .addClass('glyphicon-refresh glyphicon-refresh-animate');

        // Delete the deck.
        CardType.Delete(card_type_name)
            .always(function() {
                $new_card_type.detach();
            });
    });

    // When the main button is clicked, go to the page.
    $navigate_btn.click(function() {
        window.location.href = `/card_type/${card_type_name}`;
    });

    // Add the buttons, plus the primary button in the middle.
    return $new_card_type;
};
/**
 * Generate a Div for the decks and add it to the given $decks div.
 *
 * @class      GenerateCardTypesDiv (name)
 */
function GenerateCardTypesDiv() {
    // Get a list of decks from the API.
    $loader = $(
        `
      <div class="loading">
        <span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>
      </div>`
    );

    $('#card-types')
        .append($loader);

    // Display each deck.
    for (let card_type of CARD_TYPES) {
        $loader.before(MakeCardTypeInputGroup(card_type.name));
    }

    $loader.detach();
};

// We can generate a list of decks before the page has loaded.
let CARD_TYPES = [];
let _card_types_loading = CardType.LoadAll()
    .done(function(card_types) {
        CARD_TYPES = card_types;
        CARD_TYPES.sort(function(a, b) {
            return a.name - b.name;
        });
    });

$(function() {
    // Setup click event on the + icon.
    $('div.plus-circle')
        .click(function() {
            let $curr_new_card_type_form = $('.card-type-new');
            if ($curr_new_card_type_form.length > 0) {
                $curr_new_card_type_form.find('input')
                    .focus();
                return;
            }

            $('#card-types')
                .append(MakeNewCardTypeInputGroup());
            $('#card-types')
                .find('input')
                .focus();
        });

    _card_types_loading.always(function() {
        GenerateCardTypesDiv();
    });
});
