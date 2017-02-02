let CARD_TYPE = null;
let _card_type_loading = CardType.Load(CARD_TYPE_NAME)
    .done(function(card_type) {
        CARD_TYPE = card_type;
        CARD_TYPE.fields.sort(function(a, b) {
            return a.field_pos - b.field_pos;
        });
    });

function UpdateFieldList() {
    let new_fields = [];
    $('#fields div.field').each(function(i, e) {
        let $e = $(e);
        new_fields.push({
            field_name: $e.find('.btn-success').text(),
            field_pos: i,
        });
    })

    CARD_TYPE.fields = new_fields;
}

function MakeFieldHtml(field_name) {
    let template =
        `
  <div class="input-group field">
    <div class="input-group-btn">
      <button class="btn btn-danger">
        <span class="glyphicon glyphicon-trash"></span>
      </button>
    </div>
    <div class="btn btn-success form-control">${field_name}</div>
    <div class="input-group-btn">
      <button class="btn btn-primary">
        <span class="glyphicon glyphicon-pencil"></span>
      </button>
    </div>
  </div>`

    let $new_field_html = $(template);

    // Extract some key elements.
    let $delete_btn = $new_field_html.find('.btn-danger');
    let $edit_btn = $new_field_html.find('.btn-primary');
    let $navigate_btn = $new_field_html.find('.btn-success');

    // When the trash button is pressed, delete it.
    $delete_btn.click(function() {
        let $this = $(this);
        $delete_btn.find('.glyphicon-trash')
            .removeClass('glyphicon-trash')
            .addClass('glyphicon-refresh glyphicon-refresh-animate');

        // Remove this field from the field list.
        let matches = $.grep(CARD_TYPE.fields, function(f) {
            return f.field_name === field_name;
        });

        if (matches.length != 1) {
            console.log('PANIC');
        }

        let index = CARD_TYPE.fields.indexOf(matches[0]);
        if (index >= 0) {
            CARD_TYPE.fields.splice(index, 1);
        }

        // Save the card type.
        CARD_TYPE.Save().done(function() {
            $this.parents('.field').detach();
            GenerateFieldsList();
        });
    });

    // Add the buttons, plus the primary button in the middle.
    return $new_field_html;
};

function GenerateFieldsList() {
    // Get a list of decks from the API.
    $loader = $(
        `
    <div class="loading">
      <span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>
    </div>`
    );

    $('#fields div.field').detach();
    $('#fields').append($loader);

    // Display each deck.
    for (let field of CARD_TYPE.fields) {
        $('#fields div#field-list').append(MakeFieldHtml(field.field_name));
    }

    $loader.detach();
}

$(function() {
    // Make the fields sortable.
    $('#fields #field-list')
        .sortable({
            items: '> .field',
            update: function() {
                UpdateFieldList();

                $('#fields #field-list').sortable('disable');
                CARD_TYPE.Save().always(function() {
                    $('#fields #field-list').sortable('enable');
                })
            }
        });

    // When you click on the new field list...
    $('.new-field')
        .click(function() {
            let $this = $(this);
            if ($this.find('input').length > 0) {
                $this.find('input').focus();
                return;
            }

            let template =
                `
<div class="input-group card-type-new">
  <input class="form-control" placeholder="Add a new field..." />
  <div class="input-group-btn">
    <button class="btn btn-success">
      <span class="glyphicon glyphicon-ok"></span>
    </button>
  </div>
</div>`

            let $new_field_html = $(template);
            let $input = $new_field_html.find('input');
            let $submit_button = $new_field_html.find('.btn-success');

            $input.keypress(function(e) {
                if (e.which == 13) {
                    $submit_button.click();
                }
            });

            $submit_button.click(function() {
                // Setup a loading icon...
                $new_field_html.find('.glyphicon-ok')
                    .removeClass('glyphicon-ok')
                    .addClass('glyphicon-refresh glyphicon-refresh-animate');

                // Empty.
                if ($input.val().trim().length == 0) {
                    $new_field_html.addClass('has-error')
                        .find('input')
                        .tooltip({
                            placement: 'bottom',
                            title: function() {
                                return `Please enter a name.`;
                            },
                            trigger: 'manual',
                        })
                        .tooltip('show');

                    $new_field_html.find('.glyphicon-refresh')
                        .removeClass('glyphicon-refresh glyphicon-refresh-animate')
                        .addClass('glyphicon-ok');
                    return;
                }

                // If this field is already in the list, then remove it.
                let matches = $.grep(CARD_TYPE.fields, function(f) {
                    return f.field_name == $input.val();
                });
                if (matches.length > 0) {
                    $new_field_html.addClass('has-error')
                        .find('input')
                        .tooltip({
                            placement: 'bottom',
                            title: function() {
                                return `The name "${$input.val()}" is already taken.`;
                            },
                            trigger: 'manual',
                        })
                        .tooltip('show');

                    $new_field_html.find('.glyphicon-refresh')
                        .removeClass('glyphicon-refresh glyphicon-refresh-animate')
                        .addClass('glyphicon-ok');
                    return;
                }

                $new_field_html.removeClass('has-error').find('input').tooltip('destroy');

                // Add the new field name.
                UpdateFieldList();
                CARD_TYPE.fields.push({
                    field_name: $input.val(),
                    field_pos: CARD_TYPE.fields.length,
                });

                // Save the field.
                CARD_TYPE.Save()
                    .done(function(card_type) {
                        $new_field_html.find('input').val('');
                        GenerateFieldsList();
                    })
                    .always(function() {
                        // $new_field_html.detach();
                        $new_field_html.find('.glyphicon-refresh')
                            .removeClass('glyphicon-refresh glyphicon-refresh-animate')
                            .addClass('glyphicon-ok');
                    });
            });

            $('#fields').append($new_field_html);
            $('#fields > button').detach();
            $input.focus();
        }).click();

    _card_type_loading.always(function() {
        GenerateFieldsList();
    });
});;
