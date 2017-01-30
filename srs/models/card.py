from srs import api_manager, app, db
from srs.models import deck


class CardTypeField(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  field_name = db.Column(db.String(80))

  # Each CardTypeField belongs to exactly one CardType.
  card_type_id = db.Column(db.Integer, db.ForeignKey('card_type.id'))
  card_type = db.relationship(
      'CardType',
      backref=db.backref('card_type_field_card_type', lazy='dynamic'))

  def __init__(self, field_name):
    self.field_name = field_name


class CardTypeView(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  front_html = db.Column(db.Text())
  back_html = db.Column(db.Text())
  common_css = db.Column(db.Text())

  # Each CardTypeView belongs to exactly one CardType.
  card_type_id = db.Column(db.Integer, db.ForeignKey('card_type.id'))
  card_type = db.relationship(
      'CardType',
      backref=db.backref('card_type_view_card_type', lazy='dynamic'))

  def __init__(self, front_html, back_html, common_css):
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
  value = db.Column(db.String(80))

  # Each CardFieldValue belongs to exactly one card and is associated with
  # exactly one CardTypeField.
  card_type_field_id = db.Column(
      db.Integer, db.ForeignKey('card_type_field.id'))
  card_type = db.relationship(
      'CardTypeField',
      backref=db.backref('card_field_value_card_type', lazy='dynamic'))

  card_id = db.Column(db.Integer, db.ForeignKey('card.id'))
  card = db.relationship(
      'Card', backref=db.backref('card_field_value_card', lazy='dynamic'))

  def __init__(self, value):
    self.value = value


class Card(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  
  # Each Card has exactly one CardType. This defines which fields are available
  # and also which views are available.
  card_type_id = db.Column(db.Integer, db.ForeignKey('card_type.id'))
  card_type = db.relationship(
      'CardType', backref=db.backref('card_card_type', lazy='dynamic'))

  # Each card belongs to exactly one Deck.
  deck_id = db.Column(db.Integer, db.ForeignKey('deck.id'))
  deck = db.relationship(
      'Deck', backref=db.backref('card_deck', lazy='dynamic'))

  def __init__(self):
    pass

  @classmethod
  def query(cls):
    return (db.session.query(Card)
             .join(deck.Deck)
             .filter(deck.Deck.stormpath_id == user.href.rsplit('/')[-1]))


# Create API.
api_manager.create_api(CardTypeField, methods=['GET', 'POST', 'DELETE', 'PUT'])
api_manager.create_api(CardTypeView, methods=['GET', 'POST', 'DELETE', 'PUT'])
api_manager.create_api(CardType, methods=['GET', 'POST', 'DELETE', 'PUT'])
api_manager.create_api(CardFieldValue, methods=['GET', 'POST', 'DELETE', 'PUT'])
api_manager.create_api(Card, methods=['GET', 'POST', 'DELETE', 'PUT'])
