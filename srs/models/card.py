import srs.config as config
import srs.util as util
from flask_stormpath import user
from srs import api_manager, app, db
from srs.models import deck


class CardTypeField(db.Model):
    """A CardTypeField is a single field which is displayed on a card.

    Fields:
        id: int, a auto-incrementing ID. Generally not used much.
        name: string, the name of the field (e.g. Front, Back, Kanji, etc.).
        pos: int, the position this field should occur on the new card page.

    Foreign Keys:
        card_type_id: int, maps to exactly one card type.

    Constraints:
        (name, card_type_id) must be UNIQUE.
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(config.CARD_TYPE_FIELD_NAME_MAX_LEN))
    pos = db.Column(db.Integer)
    card_type_id = db.Column(db.Integer, db.ForeignKey('card_type.id'))

    # Allow back-filling to the CardType.
    card_type = db.relationship(
        'CardType', backref=db.backref('fields', lazy='dynamic'))

    # Constraints.
    __table_args__ = (
        db.UniqueConstraint('name', 'card_type_id'),
    )

    def __init__(self, name, pos):
        """Make a new CardTypeField given all fields."""
        self.name = name
        self.pos = pos


class CardTypeView(db.Model):
    """A CardTypeView is a single view which can be rendered of a card type.

    Fields:
        id: int, a auto-incrementing ID. Generally not used much.
        name: string, the name of the view (e.g. J --> E, E --> J, etc.).
        front_html: text, the HTML which will be shown on the front.
        back_html: text, the HTML which will be shown on the back.
        common_css: text, the CSS which will be shown on both sides.

    Foreign Keys:
        card_type_id: int, maps to exactly one card type.

    Constraints:
        (name, card_type_id) must be UNIQUE.
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(config.CARD_TYPE_FIELD_NAME_MAX_LEN))
    front_html = db.Column(db.Text())
    back_html = db.Column(db.Text())
    common_css = db.Column(db.Text())
    card_type_id = db.Column(db.Integer, db.ForeignKey('card_type.id'))

    # Allow back-filling to the CardType.
    card_type = db.relationship(
        'CardType', backref=db.backref('views', lazy='dynamic'))

    # Constraints.
    __table_args__ = (
        db.UniqueConstraint('name', 'card_type_id'),
    )

    def __init__(self, name, front_html, back_html, common_css, card_type_id):
        """Make a new CardTypeView given all fields."""
        self.name = name
        self.front_html = front_html
        self.back_html = back_html
        self.common_css = common_css
        self.card_type_id = card_type_id


class CardType(db.Model):
    """A CardType defines which fields are available and how they can be shown.

    Fields:
        id: int, a auto-incrementing ID. Generally not used much.
        stormpath_id: string, the stormpath ID which identifies the owner.
        name: string, the name of the card type. Used to query for CardTypes.

    Constraints:
        (stormpath_id, name) must be UNIQUE.
    """
    id = db.Column(db.Integer, primary_key=True)
    stormpath_id = db.Column(db.String(config.STORMPATH_ID_MAX_LEN))
    name = db.Column(db.String(config.CARD_TYPE_NAME_MAX_LEN))

    # Constraints.
    __table_args__ = (
        db.UniqueConstraint('stormpath_id', 'name'),
    )

    @classmethod
    def query(cls):
        """Overload the query() function for CardTypes.

        This will ensure that users only ever have access to CardTypes that
        they actually own. This effectively adds a filter to any query that
        they could possibly run, and is required by APIManager.
        """
        return (db.session.query(cls)
                .filter_by(stormpath_id=util.StormpathIDFromHREF(user.href)))

    def __init__(self, id, stormpath_id, name):
        """Make a new CardType given all fields."""
        self.stormpath_id = stormpath_id
        self.name = name


class CardFieldValue(db.Model):
    """A CardFieldValue is the value of a single field for a particular card.

    To simplify things, the field name is also stored here, although it should
    match something within the CardTypeField table (but this is not enforced).
    CardFieldValues which don't match anything in the CardTypeField won't be
    used, so this isn't such a big deal.

    Fields:
        id: int, a auto-incrementing ID. Generally not used much.
        field: string, the name of the field this value corresponds to.
        value: string, the value of the field.

    Foreign Keys:
        card_type_id: int, maps to exactly one card type.

    Constraints:
        (name, card_type_id) must be UNIQUE.
    """
    id = db.Column(db.Integer, primary_key=True)
    field = db.Column(db.String(config.CARD_FIELD_VALUE_FIELD_MAX_LEN))
    value = db.Column(db.String(config.CARD_FIELD_VALUE_VALUE_MAX_LEN))
    card_id = db.Column(db.Integer, db.ForeignKey('card.id'))

    # All back-filling to the Card.
    card = db.relationship(
        'Card', backref=db.backref('field_values', lazy='dynamic'))

    def __init__(self, field, value, card_id):
        """Make a new CardFieldValue given all fields."""
        self.field = field
        self.value = value
        self.card_id = card_id


class Card(db.Model):
    """A Card is a single thing that needs to be studied.

    Fields:
        id: int, a auto-incrementing ID. Used to query for cards.

    Foreign Keys:
        card_type_name: string, maps to exactly one card type name.
        deck_name: string, maps to exactly one deck_name.

    Constraints:
        (name, card_type_id) must be UNIQUE.
    """
    id = db.Column(db.Integer, primary_key=True)
    card_type_name = db.Column(db.Integer, db.ForeignKey('card_type.name'))
    deck_name = db.Column(db.Integer, db.ForeignKey('deck.name'))

    # All back-filling to the CardType.
    card_type = db.relationship(
        'CardType', backref=db.backref('cards', lazy='dynamic'))

    # All back-filling to the Deck
    deck = db.relationship('Deck', backref=db.backref('cards', lazy='dynamic'))

    @classmethod
    def query(cls):
        """Overload the query() function for Cards.

        This will ensure that the user who is adding new cards has access to
        the deck in which they are being added.
        """
        stormpath_id = util.StormpathIDFromHREF(user.href)
        return (db.session.query(cls).join(deck.Deck)
                .filter(deck.Deck.stormpath_id == stormpath_id))

    def __init__(self, card_type_name, deck_name):
        """Make a new Card given all fields."""
        self.card_type_name = card_type_name
        self.deck_name = deck_name


#
# Make the API.
#
# CardTypeFields should be accessed mostly through CardTypes, but should be
# deletable from the API.
api_manager.create_api(CardTypeField, methods=['DELETE'])

# CardTypeViews are much the same as CardTypeFields.
api_manager.create_api(CardTypeView, methods=['DELETE'])

# CardTypes should be accessible via all APIs. This will automatically
# include back-filled objects, so you can get/set/modify CardTypeFields and
# CardTypeViews via CardTypes.
api_manager.create_api(
    CardType,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    primary_key='name',
    exclude_columns=['id', 'stormpath_id', 'cards'],
    preprocessors=dict(POST=[util.AddUserIDToRequestPreProcessor]))

# CardFieldValues are similar to CardTypeFields and CardTypeViews, but they
# are accessed/added/modified through Card.
api_manager.create_api(CardFieldValue, methods=['DELETE'])

# Cards should be accessible via all APIs. This will automatically allow for
# the modification of CardFieldValues.
api_manager.create_api(
    Card,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    exclude_columns=['card_type_name', 'deck_name'])
