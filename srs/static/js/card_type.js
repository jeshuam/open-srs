let CARD_TYPE = null;
let _card_type_loading = CardType.Load(CARD_TYPE_NAME)
    .done(function(card_type) {
        CARD_TYPE = card_type;
    });

function UpdateFieldList() {
    let new_fields = [];
    $('#fields div.input-group').each(function(i, e) {
        let $e = $(e);
        new_fields.push({
            name: $e.find('.navigate-button').text(),
            pos: i,
        });
    })

    CARD_TYPE.fields = new_fields;
}

$(function() {
    _card_type_loading.always(function() {
        MakeObjectList($('#fields'), CARD_TYPE.fields, 'name', 'pos', function(field) {
            let index = CARD_TYPE.fields.indexOf(field);
            if (index >= 0) {
                CARD_TYPE.fields.splice(index, 1);
            }

            return CARD_TYPE.Save();
        }, function(field, new_name) {
            field.name = new_name;
            return CARD_TYPE.Save();
        }, function() {
            // noop, don't navigate anywhere
        }, function(new_name) {
            let result = new $.Deferred();
            let new_field = {
                name: new_name,
                pos: CARD_TYPE.fields.length,
            }

            CARD_TYPE.fields.push(new_field);
            CARD_TYPE.Save().done(function() {
                result.resolve(new_field);
            }).fail(function(response) {
                CARD_TYPE.fields.splice(CARD_TYPE.fields.length - 1, 1);
                result.reject(response);
            });

            return result;
        });

        $('#fields').sortable({
            items: '> div',
            update: function() {
                UpdateFieldList();

                $('#fields').sortable('disable');
                CARD_TYPE.Save().always(function() {
                    $('#fields').sortable('enable');
                })
            }
        });

        MakeObjectList($('#view-list'), CARD_TYPE.views, 'name', 'name', function(view) {
            let index = CARD_TYPE.views.indexOf(view);
            if (index >= 0) {
                CARD_TYPE.views.splice(index, 1);
            }

            return CARD_TYPE.Save();
        }, function(view, new_name) {
            view.name = new_name;
            return CARD_TYPE.Save();
        }, function() {
            // noop, don't navigate anywhere
        }, function(new_name) {
            let result = new $.Deferred();
            let new_view = {
                name: new_name,
                front_html: '',
                back_html: '',
                common_css: '',
            }

            CARD_TYPE.views.push(new_view);
            CARD_TYPE.Save().done(function() {
                PopulateViewTabContent(new_view);
                result.resolve(new_view);
            }).fail(function(response) {
                CARD_TYPE.views.splice(CARD_TYPE.views.length - 1, 1);
                result.reject(response);
            });

            return result;
        });

        for (let view of CARD_TYPE.views) {
            PopulateViewTabContent(view);
        }
    });

    $('#controls .btn-primary').click(function() {
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
                    $('#controls .btn-primary').click();
                    break;
            }
        } else {
            switch (event.which) {
                case 27:
                    event.preventDefault();
                    $('#controls .btn-danger').click();
                    break;
            }
        }
    });

    $('#show-views').click(function() {
        $('#views').show();
    })

    $('#controls .btn-danger').click(function() {
        $('#views').hide();
    })
});

let _view_tab_pane_template =
    `
<div class="tab-pane col-lg-12 col-sm-12 col-md-12">
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

let _view_tab_template =
    `
<li>
  <a class="view-tab-nav" data-toggle="tab"></a>
</li>
`

function PopulateViewTabContent(view) {
    // Add a new tab, just before this one.
    let id = 'view-' + view.name.replace(/ /g, '-');
    let $new_tab = $(_view_tab_template);
    $new_tab.find('a').attr('href', '#' + id).text(view.name);
    $('#controls').before($new_tab);

    // Find the corresponding tab-pane.
    let $tab_pane = $(_view_tab_pane_template).attr('id', id);

    // Add the HTML template to the tab pane.
    $tab_pane.find('.front-code > div.editor').attr('id', 'front-' + id);
    $tab_pane.find('.css > div.editor').attr('id', 'css-' + id);
    $tab_pane.find('.back-code > div.editor').attr('id', 'back-' + id);

    let $view_tab_content = $('#views .tab-content');
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
        let formatted = doFormat(css_editor.getValue(), CARD_TYPE.GetFieldsMap());
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
        let new_fields = $.extend({}, CARD_TYPE.GetFieldsMap());
        new_fields['front'] = doFormat(front_editor.getValue(), CARD_TYPE.GetFieldsMap())[0];

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
        let formatted = doFormat(front_editor.getValue(), CARD_TYPE.GetFieldsMap());
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
};
