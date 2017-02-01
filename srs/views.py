from srs import app
from srs.models.card import Card
from srs.models.deck import Deck

from flask import render_template
from flask_stormpath import login_required, user


@app.route('/')
def index():
  return render_template('index.html')


@app.route('/decks')
@login_required
def decks():
  return render_template('decks.html')

@app.route('/card_types')
@login_required
def card_types():
  return render_template('card_types.html')


@app.route('/deck/<string:name>')
@login_required
def deck(name):
  return render_template('deck.html', deck_name=name)
