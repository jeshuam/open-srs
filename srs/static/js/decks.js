function MakeNewDeckInputGroup() {
    let template =
        `
<div class="input-group deck-new">
  <input class="form-control" />
  <div class="input-group-btn">
    <button class="btn btn-success">
      <span class="glyphicon glyphicon-ok"></span>
    </button>
  </div>
</div>`

    let $new_deck_input = $(template);
    let $submit_button = $new_deck_input.find('.btn-success');

    $new_deck_input.find('input')
        .keypress(function(e) {
            if (e.which == 13) {
                $submit_button.click();
            }
        });

    $submit_button.click(function() {
        let $input = $new_deck_input.find('input');

        // Setup a loading icon...
        $new_deck_input.find('.glyphicon-ok')
            .removeClass('glyphicon-ok')
            .addClass('glyphicon-refresh glyphicon-refresh-animate');

        // Make the new deck!
        Deck.New($input.val())
            .done(function(deck) {
                DECKS.push(deck);
                $('#decks')
                    .empty();
                GenerateDecksDiv();
            })
            .fail(function(response) {
                if (response.message == 'IntegrityError') {
                    $new_deck_input.addClass('has-error')
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
                $new_deck_input.find('.glyphicon')
                    .removeClass('glyphicon-refresh glyphicon-refresh-animate')
                    .addClass('glyphicon-ok');
            });
    });

    return $new_deck_input;
}

/**
 * Generate the HTML for the given deck_name.
 *
 * @class      NewDeckInputGroup (name)
 */
function MakeDeckInputGroup(deck_name) {
    let template =
        `
<div class="input-group deck">
  <div class="input-group-btn">
    <button class="btn btn-danger">
      <span class="glyphicon glyphicon-trash"></span>
    </button>
  </div>
  <button class="btn btn-success form-control">${deck_name}</button>
  <div class="input-group-btn">
    <button class="btn btn-primary">
      <span class="glyphicon glyphicon-pencil"></span>
    </button>
  </div>
</div>`

    let $new_deck = $(template);

    // Extract some key elements.
    let $delete_btn = $new_deck.find('.btn-danger');
    let $edit_btn = $new_deck.find('.btn-primary');
    let $navigate_btn = $new_deck.find('.btn-success');

    // When the trash button is pressed, delete it.
    $delete_btn.click(function() {
        $delete_btn.find('.glyphicon-trash')
            .removeClass('glyphicon-trash')
            .addClass('glyphicon-refresh glyphicon-refresh-animate');

        // Delete the deck.
        Deck.Delete(deck_name)
            .always(function() {
                $new_deck.detach();
            });
    });

    // When the main button is clicked, go to the page.
    $navigate_btn.click(function() {
        window.location.href = `/deck/${deck_name}`;
    });

    // Add the buttons, plus the primary button in the middle.
    return $new_deck;
};
/**
 * Generate a Div for the decks and add it to the given $decks div.
 *
 * @class      GenerateDecksDiv (name)
 */
function GenerateDecksDiv() {
    // Get a list of decks from the API.
    $loader = $(
        `
      <div class="loading">
        <span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>
      </div>`
    );

    $('#decks')
        .append($loader);

    // Display each deck.
    for (let deck of DECKS) {
        $loader.before(MakeDeckInputGroup(deck.name));
    }

    $loader.detach();
};

// We can generate a list of decks before the page has loaded.
let DECKS = [];
let _decks_loading = Deck.LoadAll()
    .done(function(decks) {
        DECKS = decks;
        DECKS.sort(function(a, b) {
            return a.name - b.name;
        });
    });

$(function() {
    // Setup click event on the + icon.
    $('div.plus-circle')
        .click(function() {
            let $curr_new_deck_form = $('.deck-new');
            if ($curr_new_deck_form.length > 0) {
                $curr_new_deck_form.find('input')
                    .focus();
                return;
            }

            $('#decks')
                .append(MakeNewDeckInputGroup());
            $('#decks')
                .find('input')
                .focus();
        });

    _decks_loading.always(function() {
        GenerateDecksDiv();
    });
});
