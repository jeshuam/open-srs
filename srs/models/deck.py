from srs import api_manager, app, db

from flask_stormpath import StormpathManager, user


class Deck(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  stormpath_id = db.Column(db.String(21))
  name = db.Column(db.String(80))

  __table_args__ = (db.UniqueConstraint('stormpath_id', 'name'),)

  def __init__(self, stormpath_id, name):
    self.stormpath_id = stormpath_id
    self.name = name

  @classmethod
  def query(cls):
    """Only return results which are for the current user."""
    return db.session.query(Deck).filter_by(
        stormpath_id=user.href.rsplit('/')[-1])


# Create API.
def auth_fn_delete_deck(instance_id, **kwargs):
  """Ensure that the user can only delete this deck if they own it."""
  deck = Deck.query.filter_by(id=instance_id).first()
  if user.href.rsplit('/')[-1] != deck.stormpath_id:
    raise ProcessingException(description='Not Authorized', code=401)

def post_add_user_id(data, **kwargs):
  """Add the user ID information to new decks."""
  print(data, kwargs)
  data['stormpath_id'] = user.href.rsplit('/')[-1]

api_manager.create_api(
    Deck,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    primary_key='name',
    exclude_columns=['stormpath_id', 'cards'],
    preprocessors=dict(
      POST=[post_add_user_id],
      DELETE=[auth_fn_delete_deck],
    ))
