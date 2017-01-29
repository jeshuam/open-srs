from srs import api_manager, app, db

from flask_stormpath import StormpathManager


class Deck(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  user_href = db.Column(db.String(256))
  name = db.Column(db.String(80))

  __table_args__ = (db.UniqueConstraint('user_href', 'name'),)

  def __init__(self, user_href, email):
    self.user = StormpathManager.load_user(user_href)
    self.name = name


# Create API.
api_manager.create_api(Deck, methods=['GET', 'POST', 'DELETE', 'PUT'])
