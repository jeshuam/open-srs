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

    // Views.
    $('#add-view-tab').click(function() {
        // Add the tab button and the tab pane.
        let $tab_content = $('#views .tab-content');

        // The name is the number of tabs found so far + 1.
        let name = 'Card View ' + $tab_content.find('.tab-pane').length;

        // Add a logical tab content area.
        CARD_TYPE.views.push({
            name: name,
            front_html: '',
            back_html: '',
            common_css: '',
        });

        // Save the card type.
        CARD_TYPE.Save().done(function() {
            PopulateViewTabContent();
        });
    });

    $('#save').click(function() {
        let $save_btn = $(this);
        $save_btn.find('.glyphicon-floppy-disk')
            .removeClass('glyphicon-floppy-disk')
            .addClass('glyphicon-refresh glyphicon-refresh-animate');

        CARD_TYPE.Save().done(function() {
            $save_btn.removeClass('btn-primary').addClass('btn-success');
            $save_btn.find('.glyphicon-refresh')
                .removeClass('glyphicon-refresh glyphicon-refresh-animate')
                .addClass('glyphicon-ok');

            setTimeout(function() {
                $save_btn.removeClass('btn-success').addClass('btn-primary');
                $save_btn.find('.glyphicon-ok')
                    .removeClass('glyphicon-ok')
                    .addClass('glyphicon-floppy-disk');
            }, 1000);
        });
    });

    $(window).bind('keydown', function(event) {
        if (event.ctrlKey || event.metaKey) {
            switch (String.fromCharCode(event.which).toLowerCase()) {
                case 's':
                    event.preventDefault();
                    $('#save').click();
                    break;
            }
        }
    });

    $('#views .nav').on('click', 'a', function() {
        $('#save').show();
        $('#quit').show();
    });

    $('#quit').click(function() {
        $('#save').hide();
        $('#quit').hide();
        $('#views .active').removeClass('active');
    })

    $('#save').hide();
    $('#quit').hide();

    _card_type_loading.always(function() {
        GenerateFieldsList();
        PopulateViewTabContent();
    });
});

let _view_tab_pane_template =
    `
<div class="tab-pane">
  <div class="front-code">
    <div class="header"><h1>Front</h1></div>
    <div class="editor"></div>
  </div>
  <div class="css">
    <div class="header"><h1>CSS</h1></div>
    <div class="editor"></div>
  </div>
  <div class="back-code">
    <div class="header"><h1>Back</h1></div>
    <div class="editor"></div>
  </div>
  <iframe class="front-preview">
    <style></style>
    <div></div>
  </iframe>
  <iframe class="back-preview">
    <head><style></style></head>
    <body></body>
  </iframe>
</div>
`

function PopulateViewTabContent() {
    let $view_tab_content = $('#views .tab-content');
    $view_tab_content.empty();
    $('#views .nav-tabs .view-tab-nav').detach();

    // Build a list of fields which can be templated.
    let fields = {};
    for (let field of CARD_TYPE.fields) {
        fields[field.field_name] = `(${field.field_name})`;
    }

    for (let view of CARD_TYPE.views) {
        // Add a new tab, just before this one.
        let id = 'view-' + view.name.replace(/ /g, '-');
        let $new_tab = $(`<li><a href="#${id}" class="view-tab-nav" data-toggle="tab">${view.name}</a></li>`);
        $('#add-view-tab').before($new_tab);

        // Find the corresponding tab-pane.
        let $tab_pane = $(_view_tab_pane_template).attr('id', id);

        // Add the HTML template to the tab pane.
        $tab_pane.find('.front-code > div.editor').attr('id', 'front-' + id);
        $tab_pane.find('.css > div.editor').attr('id', 'css-' + id);
        $tab_pane.find('.back-code > div.editor').attr('id', 'back-' + id);

        $view_tab_content.append($tab_pane);

        // Add style tags to both.
        $tab_pane.find('.front-preview').contents().find('head').append('<style>');
        $tab_pane.find('.back-preview').contents().find('head').append('<style>');

        let doFormat = function(text, fields) {
            let result = text,
                failed = false;
            try {
                result = nunjucks.renderString(text, fields);
            } catch (error) {
                result = error;
                failed = true;
            }

            return [result, failed];
        }

        var front_editor = ace.edit('front-' + id);
        front_editor.setTheme('ace/theme/monokai');
        front_editor.getSession().setMode('ace/mode/html');

        var css_editor = ace.edit('css-' + id);
        css_editor.setTheme('ace/theme/monokai');
        css_editor.getSession().setMode('ace/mode/css');
        css_editor.getSession().on('change', function() {
            let formatted = doFormat(css_editor.getValue(), fields);
            $tab_pane.find('.front-preview').contents().find('style').text(formatted[0]);
            $tab_pane.find('.back-preview').contents().find('style').text(formatted[0]);
            view.common_css = css_editor.getValue();
        });

        css_editor.setValue(view.common_css, -1);

        var back_editor = ace.edit('back-' + id);
        back_editor.setTheme('ace/theme/monokai');
        back_editor.getSession().setMode('ace/mode/html');
        back_editor.getSession().on('change', function() {
            // Add some custom fields.
            let new_fields = $.extend({}, fields);
            new_fields['front'] = doFormat(front_editor.getValue(), fields)[0];

            // Format the back and display it.
            let formatted = doFormat(back_editor.getValue(), new_fields);
            let $body = $tab_pane.find('.back-preview').contents().find('body');
            if (!formatted[1]) {
                $body.html(formatted[0]);
            } else {
                $body.text(formatted[0]);
            }

            view.back_html = back_editor.getValue();
        });

        front_editor.getSession().on('change', function() {
            let formatted = doFormat(front_editor.getValue(), fields);
            let $body = $tab_pane.find('.front-preview').contents().find('body');
            if (!formatted[1]) {
                $body.html(formatted[0]);
            } else {
                $body.text(formatted[0]);
            }

            view.front_html = front_editor.getValue();
            back_editor.setValue(back_editor.getValue(), -1);
        });

        front_editor.setValue(view.front_html, -1);
        back_editor.setValue(view.back_html, -1);
    }
};
