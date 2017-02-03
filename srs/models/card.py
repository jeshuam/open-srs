from flask_stormpath import user
from srs import api_manager, app, db
from srs.models import deck


class CardTypeField(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    field_name = db.Column(db.String(80))
    field_pos = db.Column(db.Integer)

    # Each CardTypeField belongs to exactly one CardType.
    card_type_id = db.Column(db.Integer, db.ForeignKey('card_type.id'))
    card_type = db.relationship(
        'CardType',
        backref=db.backref('fields', lazy='dynamic'))

    __table_args__ = (db.UniqueConstraint('field_name', 'card_type_id'),)

    def __init__(self, field_name, field_pos):
        self.field_name = field_name
        self.field_pos = field_pos


class CardTypeView(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80))
    front_html = db.Column(db.Text())
    back_html = db.Column(db.Text())
    common_css = db.Column(db.Text())

    # Each CardTypeView belongs to exactly one CardType.
    card_type_id = db.Column(db.Integer, db.ForeignKey('card_type.id'))
    card_type = db.relationship(
        'CardType',
        backref=db.backref('views', lazy='dynamic'))

    __table_args__ = (db.UniqueConstraint('name', 'card_type_id'),)

    def __init__(self, name, front_html, back_html, common_css):
        self.name = name
        self.front_html = front_html
        self.back_html = back_html
        self.common_css = common_css


class CardType(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    stormpath_id = db.Column(db.String(21))
    name = db.Column(db.String(80))

    __table_args__ = (db.UniqueConstraint('stormpath_id', 'name'),)

    def __init__(self, stormpath_id, name):
        self.stormpath_id = stormpath_id
        self.name = name

    @classmethod
    def query(cls):
        return db.session.query(CardType).filter_by(
            stormpath_id=user.href.rsplit('/')[-1])


class CardFieldValue(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    field = db.Column(db.String(80))
    value = db.Column(db.String(80))

    # Each CardFieldValue belongs to exactly one Card.
    card_id = db.Column(db.Integer, db.ForeignKey('card.id'))
    card = db.relationship(
        'Card', backref=db.backref('field_values', lazy='dynamic'))

    def __init__(self, value):
        self.value = value


class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # Each Card has exactly one CardType. This defines which fields are available
    # and also which views are available.
    card_type_name = db.Column(db.Integer, db.ForeignKey('card_type.name'))
    card_type = db.relationship(
        'CardType', backref=db.backref('cards', lazy='dynamic'))

    # Each card belongs to exactly one Deck.
    deck_name = db.Column(db.Integer, db.ForeignKey('deck.name'))
    deck = db.relationship(
        'Deck', backref=db.backref('cards', lazy='dynamic'))

    def __init__(self, card_type_name, deck_name):
        self.card_type_name = card_type_name
        self.deck_name = deck_name

    @classmethod
    def query(cls):
        return (db.session.query(Card)
                .join(deck.Deck)
                .filter(deck.Deck.stormpath_id == user.href.rsplit('/')[-1]))


# Create API.
def auth_fn_delete_card_type(instance_id, **kwargs):
    """Ensure that the user can only delete this deck if they own it."""
    deck = CardType.query.filter_by(id=instance_id).first()
    if user.href.rsplit('/')[-1] != deck.stormpath_id:
        raise ProcessingException(description='Not Authorized', code=401)


def post_add_user_id(data, **kwargs):
    """Add the user ID information to new decks."""
    print(data, kwargs)
    data['stormpath_id'] = user.href.rsplit('/')[-1]

api_manager.create_api(CardTypeField, methods=['GET', 'POST', 'DELETE', 'PUT'])
api_manager.create_api(CardTypeView, methods=['GET', 'POST', 'DELETE', 'PUT'])
api_manager.create_api(
    CardType,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    primary_key='name',
    exclude_columns=['stormpath_id', 'cards'],
    preprocessors=dict(
        POST=[post_add_user_id],
        DELETE=[auth_fn_delete_card_type],
    ))

api_manager.create_api(CardFieldValue, methods=[
                       'GET', 'POST', 'DELETE', 'PUT'])
api_manager.create_api(
    Card,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    exclude_columns=['card_type', 'deck'])
