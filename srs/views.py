from flask import render_template
from flask_stormpath import login_required, user
from srs import app
from srs.models.card import Card
from srs.models.deck import Deck


#
# Utility pages.
#
@app.route('/')
def index():
    return render_template('index.html')


#
# Pages for viewing lists (of decks, card_types and cards).
#
@app.route('/decks')
@login_required
def decks():
    return render_template('decks.html')


@app.route('/card_types')
@login_required
def card_types():
    return render_template('card_types.html')


#
# Pages for viewing individual items (decks, card_types and cards).
#
@app.route('/deck/<string:name>')
@login_required
def deck(name):
    return render_template('deck.html', deck_name=name)


@app.route('/card_type/<string:name>')
@login_required
def card_type(name):
    return render_template('card_type.html', card_type_name=name)
