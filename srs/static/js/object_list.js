/**
 * This file contains a bunch of utilities which can be used to generate a list of objects. The objects will appear as
 * a sort-of button, which can be deleted and edited. New entries can also be created.
 */

/**
 * _show_error - Convert the given $input_group into an error state.
 *
 * @param  {object} $input_group The jQuery input group to modify.
 * @param  {string} error        The error message to display on the input within $input_group.
 */
function _show_error($input_group, error) {
    let $input = $input_group.find('input');
    $input_group.addClass('has-error');
    if ($input.data && $input.data('bs.tooltip')) {
        $input.tooltip('destroy');
    }

    setTimeout(function() {
        $input.tooltip({
            placement: 'bottom',
            title: error,
            trigger: 'manual',
        }).tooltip('show');
    }, 200);
}

/**
 * _hide_error - Perform the opposite of _show_error, undoing all of its effects.
 *
 * @param  {object} $input_group The input group to move to a non-error state.
 */
function _hide_error($input_group) {
    $input_group.removeClass('has-error').find('input').tooltip('destroy');
}

/**
 * _make_new_row_row - Make a row which can make new rows.
 *
 * This row will look very similar to a row in edit form, but the behaviour is slightly different.
 *
 * @param  {function} new_fn      See description on MakeRows().
 * @param  {string}   name_key    See description on MakeRows().
 * @param  {function} delete_fn   See description on MakeRows().
 * @param  {function} edit_fn     See description on MakeRows().
 * @param  {function} navigate_fn See description on MakeRows().
 * @return {object}               The jQuery object representing the row which makes new rows.
 */
function _make_new_row_row(new_fn, name_key, delete_fn, edit_fn, navigate_fn) {
    let row_template_html =
        `
  <div class="input-group">
    <input type="text" class="form-control" />
    <div class="input-group-btn">
      <button class="new-button btn btn-success"  data-loading-text="<span class='glyphicon glyphicon-refresh glyphicon-refresh-animate'></span>">
        <span class="glyphicon glyphicon-ok"></span>
      </button>
    </div>
  </div>
  `
    // Make the jQuery object.
    let $row = $(row_template_html);

    // Extract some key elements.
    let $new_btn = $row.find('.new-button');
    let $input = $row.find('input');

    // On new...
    $input.keypress(function(e) {
        if (e.which == 13) {
            $new_btn.click();
        }
    });

    $new_btn.click(function() {
        if ($input.val().trim() == '') {
            _show_error($row, 'You must enter something!');
            return;
        }

        $new_btn.button('loading');
        new_fn($input.val()).done(function(object) {
            $row.replaceWith(_make_new_row(object, name_key, delete_fn, edit_fn, navigate_fn));
        }).fail(function(response) {
            _show_error($row, 'Name already in use!');
        }).always(function() {
            $new_btn.button('reset');
        });
    });

    return $row;
}

/**
 * _make_new_row - Make a new row and return it.
 *
 * @param  {object}   object      The object which a new row should be made out of.
 * @param  {string}   name_key    See description on MakeRows().
 * @param  {function} delete_fn   See description on MakeRows().
 * @param  {function} edit_fn     See description on MakeRows().
 * @param  {function} navigate_fn See description on MakeRows().
 * @return {object}               The jQuery row created to represent this object.
 */
function _make_new_row(object, name_key, delete_fn, edit_fn, navigate_fn) {
    let row_template_html =
        `
  <div class="input-group">
    <div class="input-group-btn">
      <button class="trash-button btn btn-danger" data-loading-text="<span class='glyphicon glyphicon-refresh glyphicon-refresh-animate'></span>">
        <span class="glyphicon glyphicon-trash"></span>
      </button>
    </div>
    <div class="navigate-button btn btn-success form-control">${object[name_key]}</div>
    <input style="display:none;" type="text" class="form-control" />
    <div class="input-group-btn">
      <button class="edit-button btn btn-primary">
        <span class="glyphicon glyphicon-pencil"></span>
      </button>
      <button style="display: none;" class="edit-save-button btn btn-success"  data-loading-text="<span class='glyphicon glyphicon-refresh glyphicon-refresh-animate'></span>">
        <span class="glyphicon glyphicon-ok"></span>
      </button>
    </div>
  </div>
  `
    // Make the jQuery object.
    let $row = $(row_template_html);

    // Extract some key elements.
    let $delete_btn = $row.find('.trash-button');
    let $edit_btn = $row.find('.edit-button');
    let $edit_save_btn = $row.find('.edit-save-button');
    let $navigate_btn = $row.find('.navigate-button');
    let $input = $row.find('input');

    // On navigate...
    $navigate_btn.click(function() {
        navigate_fn(object);
    });

    // On delete...
    $delete_btn.click(function() {
        $delete_btn.button('loading');
        delete_fn(object).always(function() {
            $row.detach();
            $delete_btn.button('reset');
        });
    });

    // On edit...
    $edit_btn.click(function() {
        $navigate_btn.hide();
        $edit_btn.hide();
        $delete_btn.hide();
        $edit_save_btn.show();
        $input.show().val($navigate_btn.text()).focus().select();
    });

    // When the user saves the input form...
    $input.keypress(function(e) {
        if (e.which == 13) {
            $edit_save_btn.click();
        }
    });

    $edit_save_btn.click(function(e) {
        if ($input.val().trim() == '') {
            _show_error($row, 'You must enter something!');
            return;
        }

        $edit_save_btn.button('loading');
        $row.removeClass('has-error');
        edit_fn(object, $input.val()).always(function(response) {
            if (response && response.message == 'IntegrityError') {
                _show_error($row, 'Name already in use!');
            } else {
                _hide_error($row);

                // Update the HTML.
                $navigate_btn.text($input.val());

                // Re-jig what is visible.
                $edit_save_btn.hide();
                $input.hide();
                $edit_btn.show();
                $navigate_btn.show();
                $delete_btn.show();
            }

            $edit_save_btn.button('reset');
        });
    });

    // Add this row to the DOM.
    return $row;
}

/**
 * MakeRows - The main interface function of this library; make a set of rows and add them to the given container.
 *
 * @param  {Object}   $container  A jQuery-like container in which to store the rows. It should be empty and have the
 *                                class "object-list". It must be a div.
 * @param  {Object[]} objects     A list of objects to create rows for.
 * @param  {string}   name_key    The key within `object` which can be accessed to get the string name.
 * @param  {string}   sort_key    The key within `object` which cam be used to sort them.
 * @param  {function} delete_fn   A function to call when the object is deleted. This should return a Promise-like
 *                                object which, when complete, resolves with no argument.
 * @param  {function} edit_fn     A function to call when the object has been edited. This should take a single argument
 *                                (the new object name) and return a Promise-like object which, when complete, resolves
 *                                with a response object. response.message should be populated (resolve to true) iff
 *                                there was an error.
 * @param  {function} navigate_fn A function to call when navigating to the object (i.e. clicking on it). This should
 *                                take a single argument (the object to navigate to).
 * @param  {function} new_fn      A function which takes a single argument (the new row name) and saves a new row to the
 *                                database. This function should return a Promise-like object which, on .done(), provides
 *                                the fully (and newly saved) object.
 */
function MakeObjectList($container, objects, name_key, sort_key, delete_fn, edit_fn, navigate_fn, new_fn) {
    // Add a loader to the container.
    $loader = $(
        `
    <div class="loading">
      <span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>
    </div>`
    );

    $container.html($loader);

    // Sort the objects based on their name.
    objects.sort(function(a, b) {
        if (a[sort_key] < b[sort_key]) return -1;
        if (a[sort_key] > b[sort_key]) return 1;
        return 0;
    });

    // Generate the rows.
    let $rows = $('<div>');
    for (let object of objects) {
        $rows.append(_make_new_row(object, name_key, delete_fn, edit_fn, navigate_fn));
    }

    // Add a special button to the bottom, which will allow adding new items.
    let $new_btn_div = $('<div class="new-btn"><button class="btn btn-primary">+</button></div>');
    let $new_btn = $new_btn_div.find('button');
    $new_btn.click(function() {
        let $new_row = _make_new_row_row(new_fn, name_key, delete_fn, edit_fn, navigate_fn);
        $new_btn_div.before($new_row);
        $new_row.find('input').focus();
    });

    $rows.append($new_btn_div);

    // Add the rows to the container.
    $container.empty().append($rows.find('> div'));
}
