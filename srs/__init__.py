from flask import Flask
from flask_restless import APIManager, ProcessingException
from flask_stormpath import StormpathManager, user
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SECRET_KEY'] = 'opensrs super secret'

# TODO(jeshua): This stuff should not be here. Like, it really shouldn't. If
# this ever becomes a real thing, please move these somewhere more secure.
app.config['STORMPATH_API_KEY_ID'] = '646KV4LB30OGVAMHVEMFGK0N0'
app.config[
    'STORMPATH_API_KEY_SECRET'] = 'JSucwgxmRec03OV7D91+fLVg700JGAR8PvljlK2k3t4'
app.config['STORMPATH_APPLICATION'] = 'Open SRS'

stormpath_manager = StormpathManager(app)

# Configure SQL.
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Make the API functions.
def api_check_logged_in(**kwargs):
  if not user.is_authenticated:
    raise ProcessingException(description='Not Authorized', code=401)

api_manager = APIManager(
    app,
    flask_sqlalchemy_db=db,
    preprocessors=dict(
        POST=[api_check_logged_in],
        GET_SINGLE=[api_check_logged_in],
        GET_MANY=[api_check_logged_in],
        PUT_SINGLE=[api_check_logged_in],
        DELETE_SINGLE=[api_check_logged_in],
    ))


# Import views.
import srs.views

# Import database definition.
import srs.models.deck
import srs.models.card
