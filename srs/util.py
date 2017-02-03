"""This module contains a set of utilities useful for all Python."""

from flask_stormpath import user


def StormpathIDFromHREF(href):
    """Extract the Stormpath ID from a given HREF.

    Args:
        href: string, the Stormpath HREF value.

    Returns:
        string, the Stormpath ID extracted from the HREF.
    """
    return href.rsplit('/', 1)[-1]


def AddUserIDToRequestPreProcessor(data, **kwargs):
    """Add the current user's stormpath_id to the data request.

    This is needed for POST functions to anything which has a stormpath_id
    field. This will ensure that the entry in the database will have the
    correct value for the field without having to expose the value anywhere
    in the API.
    """
    data['stormpath_id'] = StormpathIDFromHREF(user.href)
