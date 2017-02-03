import srs.config as config
import srs.util as util
from flask_stormpath import user
from srs import api_manager, app, db


class Deck(db.Model):
    """A Deck is a set of cards which should be reviewed together.

    The main purpose of a deck is to configure how cards are reviewed/learned.

    Fields:
        id: int, a auto-incrementing ID. Generally not used much.
        stormpath_id: string, the stormpath ID which identifies the owner.
        name: string, the name of the card type. Used to query for Decks.

    Constraints:
        (stormpath_id, name) must be UNIQUE.
    """
    id = db.Column(db.Integer, primary_key=True)
    stormpath_id = db.Column(db.String(config.STORMPATH_ID_MAX_LEN))
    name = db.Column(db.String(config.DECK_NAME_MAX_LEN))

    # Constraints.
    __table_args__ = (
        db.UniqueConstraint('stormpath_id', 'name'),
    )

    @classmethod
    def query(cls):
        """Overload the query() function for Decks.

        This will ensure that users only ever have access to Decks that they
        actually own. This effectively adds a filter to any query that they
        could possibly run, and is required by APIManager.
        """
        return (db.session.query(cls)
                .filter_by(stormpath_id=util.StormpathIDFromHREF(user.href)))

    def __init__(self, stormpath_id, name):
        """Make a new Deck given all fields."""
        self.stormpath_id = stormpath_id
        self.name = name


#
# Make the API.
#
# Decks should be accessible via all APIs.
api_manager.create_api(
    Deck,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    primary_key='name',
    exclude_columns=['id', 'stormpath_id', 'cards'],
    preprocessors=dict(POST=[util.AddUserIDToRequestPreProcessor]))
