/**
 * Generate the HTML for the given deck_name.
 *
 * @class      NewDeckInputGroup (name)
 */
function NewDeckInputGroup(deck_name) {
  var $input_group_btn_tmpl =
      $('<div>')
          .addClass('input-group-btn')
          .html($('<button>')
                    .addClass('btn')
                    .html($('<span>').addClass('glyphicon')));

  // Make the main input group.
  var $new_input_group = $('<div>').addClass('input-group');

  // Make the buttons on the left and right of the input group.
  var $trash_btn = $input_group_btn_tmpl.clone();
  $trash_btn.find('.btn').addClass('btn-danger');
  $trash_btn.find('.glyphicon').addClass('glyphicon-trash');

  var $edit_btn = $input_group_btn_tmpl.clone();
  $edit_btn.find('.btn').addClass('btn-primary');
  $edit_btn.find('.glyphicon').addClass('glyphicon-pencil');

  var $deck_btn = $('<button>')
                      .addClass('btn btn-success form-control')
                      .text(deck_name)
                      .click(function() {
                        window.location.href = sprintf('/deck/%s', deck_name);
                      });

  // Add the buttons, plus the primary button in the middle.
  $new_input_group.append($trash_btn);
  $new_input_group.append($deck_btn);
  $new_input_group.append($edit_btn);
  return $new_input_group;
};

/**
 * Generate a Div for the decks and add it to the given $decks div.
 *
 * @class      GenerateDecksDiv (name)
 */
function GenerateDecksDiv($decks_div) {
  // Get a list of decks from the API.
  $decks_div.append(
      '<div class="loading">' +
      '<span class="glyphicon glyphicon-refresh glyphicon-refresh-animate">' +
      '</span>' +
      '</div>');

  $.get('/api/deck', function(response) {
    // Sort the decks by name.
    response.objects.sort(function(a, b) { return a.name - b.name; });

    // Add the objects
    var $loader = $decks_div.find('.loading');
    for (var deck of response.objects) {
      $loader.before(NewDeckInputGroup(deck.name));
    }

    // Remove the loading icon.
    $loader.detach();
  });
};

$(function() {

  // Re-generate the decks div.
  var $decks = $('#decks');
  GenerateDecksDiv($decks);

  // Setup the click event for creating a new deck.
  $('#new-deck .plus-circle')
      .click(function() {
        // If the new deck form is shown, then just show it and focus it.
        var $existing_input_group = $('.new-deck');
        if ($existing_input_group.length > 0) {
          $existing_input_group.find('input').focus();
          return;
        }

        // Add a new input to the list of decks. This allows the user to type
        // in a name. When they press enter (or click the check mark), save
        // the new deck.
        var $new_input_group = NewDeckInputGroup();

        // Add a class so we can idenfity it.
        $new_input_group.addClass('new-deck');

        // Replace the deck name with an input field.
        $new_input_group.find('button.btn-success')
            .replaceWith($(
                '<input type="text" class="form-control" placeholder="name" name="name">'));

        // Hide the trash button for now.
        $new_input_group.find('.input-group-btn').first().hide();

        // Change the edit button into a check button.
        $new_input_group.find('.input-group-btn button')
            .last()
            .removeClass('btn-primary')
            .addClass('btn-success');
        $new_input_group.find('.input-group-btn button span')
            .last()
            .removeClass('glyphicon-pencil')
            .addClass('glyphicon-ok');

        // Add this input group to the decks list.
        $decks.append($new_input_group);
        $new_input_group.find('input').focus();

        // Add events to this button.
        $new_input_group.find('input').keypress(function(e) {
          if (e.which == 13) {
            $new_input_group.find('.btn-success').click();
          }
        });

        $new_input_group.find('.btn-success')
            .click(function() {
              var name = $new_input_group.find('input').val();
              console.log(name);

              // Make sure this deck name doesn't already exist.
              var deck_names = $('#decks .input-group:not(.new-deck)')
                                   .find('.btn-success')
                                   .text();
              if (deck_names.indexOf(name) >= 0) {
                console.log('SHIT');
                return;
              }

              // Save the new deck!
              $new_input_group.find('.glyphicon-ok')
                  .removeClass('glyphicon-ok')
                  .addClass('glyphicon-animate glyphicon-refresh-animate');
              $.post({
                url: '/api/deck',
                data: JSON.stringify({'name': name}),
                contentType: 'application/json',
                success: function(response) {
                  $decks.empty();
                  GenerateDecksDiv($decks);
                },
              });
            });
      });

});
